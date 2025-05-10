import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notification';
import { autoSign } from '@/lib/signature';

export async function POST(req: NextRequest) {
  // Xác thực request
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Bước 1: Gửi thông báo cho giao dịch sắp hạn
  const transactionsToNotify = await prisma.transaction.findMany({
    where: {
      notifyAt: { lte: new Date() },
      status: 'PENDING'
    }
  });

  for (const tx of transactionsToNotify) {
    await sendNotification(tx.userId, `Vui lòng ký giao dịch ${tx.id}`);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'WAITING_SIGNATURE' }
    });
  }

  // Bước 2: Tự động ký nếu quá hạn
  const expiredTransactions = await prisma.transaction.findMany({
    where: {
      expireAt: { lte: new Date() },
      status: 'WAITING_SIGNATURE'
    }
  });

  for (const tx of expiredTransactions) {
    const signature = await autoSign(tx.content);
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signature
      }
    });
  }

  return NextResponse.json({
    notified: transactionsToNotify.length,
    autoSigned: expiredTransactions.length
  });
}

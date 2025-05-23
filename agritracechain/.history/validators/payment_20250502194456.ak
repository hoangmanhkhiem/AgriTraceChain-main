use cardano/address.{Address}
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction, OutputReference}
use vodka_extra_signatories.{key_signed}
use vodka_validity_range.{valid_after}
pub type PaymentDatum{
  product_id: ByteArray,
  seller_address: Address,
  price: Int,
  deadline: Int,
  is_paid: Bool,
}
pub type Redeemer{
  action: ByteArray,
  buyer_address: VerificationKeyHash,
  payment_amount: Int,
}
validator payment{
    spend(datum_otp: Option<PaymentDatum>, redeemer: Redeemer, _own_ref: OutputReference, self: Transaction) {
        expect Some(datum)
       expect Transaction{ inputs, outputs, extra_signatories, validity_range, ..} = self
       when redeemer.action is{
       
        "Refund" -> {
            and{
            key_signed(extra_signatories, redeemer.buyer_address)?,
            datum.is_paid == True ?,
            !valid_after(validity_range, datum.deadline)?,
            datum.price == redeemer.payment_amount ?,
            }
        }
        "Cancel" -> {
            and{
            key_signed(extra_signatories, redeemer.buyer_address)?,
            redeemer.is_paid == True ?,
            !valid_after(validity_range, datum.deadline)?,
            }
        }
        _-> {
            False
        }
       }
    }
}
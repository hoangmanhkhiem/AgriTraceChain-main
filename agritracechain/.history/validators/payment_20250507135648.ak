use cardano/address.{Address}
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction, OutputReference}
use vodka_extra_signatories.{key_signed}
pub type PaymentDatum{
  buyer: VerificationKeyHash,
  shopper: VerificationKeyHash,
  product_id: ByteArray,
  product_name: ByteArray,
  timeExpire: Int,
  is_paid: Int,
  price: Int,
}
pub type Redeemer{
  action: ByteArray,
  
}
validator payment{
    spend(datum_otp: Option<PaymentDatum>, redeemer: Redeemer, _own_ref: OutputReference, self: Transaction) {
        expect Some(datum) = datum_otp
       expect Transaction{extra_signatories, ..} = self
       let signByBuyer = key_signed(extra_signatories, datum.buyer)
       let signByShopper = key_signed(extra_signatories, datum.shopper)
       when redeemer.action is{
        "refund"-> {
                signByBuyer?
        }
        "getPaid"-> {
                signByShopper
        }
        _-> fail
       
        
       }
    }
}
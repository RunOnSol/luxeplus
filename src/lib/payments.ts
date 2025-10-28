export interface PaymentConfig {
  email: string;
  amount: number;
  reference: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function initializePaystack(config: PaymentConfig) {
  const script = document.createElement("script");
  script.src = "https://js.paystack.co/v1/inline.js";
  script.async = true;

  script.onload = () => {
    const handler = (window as any).PaystackPop.setup({
      key:
        import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
        "pk_live_7056927da639ba6d822d6cf8535b55721b936849",
      email: config.email,
      amount: config.amount * 100,
      ref: config.reference,
      onClose: config.onClose,
      callback: (response: any) => {
        if (response.status === "success") {
          config.onSuccess();
        }
      },
    });

    handler.openIframe();
  };

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}

export function initializeFlutterwave(config: PaymentConfig) {
  const script = document.createElement("script");
  script.src = "https://checkout.flutterwave.com/v3.js";
  script.async = true;

  script.onload = () => {
    (window as any).FlutterwaveCheckout({
      public_key:
        import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK_TEST-demo",
      tx_ref: config.reference,
      amount: config.amount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: config.email,
      },
      customizations: {
        title: "LuxePlus",
        description: "Payment for order",
        logo: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100",
      },
      callback: (response: any) => {
        if (response.status === "successful") {
          config.onSuccess();
        }
      },
      onclose: config.onClose,
    });
  };

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}

export function initiateWhatsAppPayment(
  phoneNumber: string,
  amount: number,
  orderRef: string
) {
  const message = encodeURIComponent(
    `Hello! I would like to complete my payment for order ${orderRef}.\n\nAmount: ₦${amount.toLocaleString()}\n\nPlease send me payment instructions.`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

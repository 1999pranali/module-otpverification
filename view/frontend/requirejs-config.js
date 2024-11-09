var config = {
    deps: [
            'Coditron_OTPVerification/js/validation',
            'Coditron_OTPVerification/js/lib/knockout/bindings/mage-init-update',
    ],
    map: {
        '*': {
            verifyOtp: 'Coditron_OTPVerification/js/verifyOtp',
            verifyCheckoutOtp: 'Coditron_OTPVerification/js/verifyCheckoutOtp',
            'Magento_Customer/js/view/authentication-popup': 'Coditron_OTPVerification/js/view/form/element/email-phonenumber-login'
        }
    },
    config: {
        mixins: {
            'Magento_Checkout/js/view/authentication': {
                'Coditron_OTPVerification/js/view/authentication-mixin': true
            },
        }
    }
};

/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

define(
    [
        'uiComponent',
        'Magento_Checkout/js/model/payment/additional-validators',
        'Coditron_OTPVerification/js/model/validateOtp'
    ],
    function (Component, additionalValidators, otpValidation) {
        'use strict';
        additionalValidators.registerValidator(otpValidation);
        return Component.extend({});
    }
);

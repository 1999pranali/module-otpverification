/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

define([
    'jquery',
    'Magento_Checkout/js/view/form/element/email',
    'ko',
    'uiRegistry',
    'mage/validation',
], function ($, CheckoutEmail, ko, registry) {
    'use strict';

    return CheckoutEmail.extend({
        defaults: {
            template: 'Coditron_OTPVerification/form/element/email-phonenumber',
        },
        config: ko.observable({}),
        
        /**
         * @inheritdoc 
         */
        initialize: function(config) {
            this.config(config);
            this._super();
            return this;
        },

        /**
         * Returns computed observable for username field type
         */
        getUsernameFieldType: function (currentValue) {
            return ko.computed(function () {
                return currentValue;
            }.bind(this));
        },

        /**
         * Returns computed observable for username data-validate
         */
        getUsernameFieldDataValidate: function (currentValue) {
            return ko.computed(function () {
                return currentValue;
            }.bind(this));
        },

        /**
         * Returns computed observable for username field label
         */
        getUsernameFieldLabel: function (currentValue) {
            return ko.computed(function () {
                return currentValue;
            }.bind(this));
        },

        /**
         * Returns computed observable to initialize OTP component
         */
        getOtpModalComponent: function () {
            return ko.computed(function () {
                if (this.isPasswordVisible() && this.config().hasOwnProperty('otpModalComponent')) {
                    return JSON.stringify(this.config().otpModalComponent);
                }
                return "{}";
            }.bind(this));
        },

        /**
         * @inheritdoc
         */
        login: function (loginForm) {
            var otpModalConfig = this.config().hasOwnProperty('otpModalComponent')
                ? Object.values(this.config().otpModalComponent).pop()
                : {},
                isModuleEnabled = otpModalConfig.hasOwnProperty('isModuleEnabled')
                    ? Number(otpModalConfig.isModuleEnabled)
                    : false;
            if (!isModuleEnabled || isModuleEnabled && registry.get('CT_otp_submit_form') == "1") {
                registry.remove('CT_otp_submit_form');
                this._super(loginForm);
            }
        }
    });
});

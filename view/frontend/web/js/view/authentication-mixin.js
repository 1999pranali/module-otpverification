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
    'Coditron_OTPVerification/js/model/login-config',
    'ko',
    'uiRegistry',
], function ($, loginConfig, ko, registry) {
    'use strict';

    var loginConfigObservable = ko.observable({});

    var mixin = {
        defaults: {
            template: 'Coditron_OTPVerification/authentication'
        },

        /**
         * Initialize Component
         */
        initialize: function() {
            this._super();
            loginConfig
                .getConfig()
                .done(function (response) {
                    if (!response.error) {
                        loginConfigObservable(response.data);
                    }
                }.bind(this));
            
            return this;
        },

        /**
         * Returns Username Field Label
         * 
         * @returns {String}
         */
        getUsernameLabel: function () {
            return ko.computed(function () {
                var loginConfigData = loginConfigObservable();
                if (loginConfigData.hasOwnProperty('usernameFieldConfig')) {
                    return loginConfigData.usernameFieldConfig.label;
                }

                return 'Email';
            });
        },

        /**
         * @returns {String}
         */
        getUsernameType: function () {
            return ko.computed(function () {
                var loginConfigData = loginConfigObservable();
                if (loginConfigData.hasOwnProperty('usernameFieldConfig')) {
                    return loginConfigData.usernameFieldConfig.type;
                }

                return 'email';
            });
        },

        /**
         * @returns {String}
         */
        getUsernameDataValidate: function () {
            return ko.computed(function () {
                var loginConfigData = loginConfigObservable();
                if (loginConfigData.hasOwnProperty('usernameFieldConfig')) {
                    return loginConfigData.usernameFieldConfig.dataValidate;
                }

                return '{required: true, "validate-email": true}';
            });
        },

        /**
         * Returns Otp modal config
         * 
         * @returns {Object}
         */
        getOtpModalComponent: function () {
            return ko.computed(function () {
                var loginConfigData = loginConfigObservable();
                if (loginConfigData.hasOwnProperty('otpModalComponent')) {
                    return JSON.stringify(loginConfigData.otpModalComponent);
                }

                return "{}";
            });
        },

        /**
         * @inheritdoc
         */
        login: function (loginForm) {
            var otpModalConfig = loginConfigObservable().hasOwnProperty('otpModalComponent') ?
                Object.values(loginConfigObservable().otpModalComponent).pop() :
                {},
                isModuleEnabled = otpModalConfig.hasOwnProperty('isModuleEnabled') ? Number(otpModalConfig.isModuleEnabled) : false;
            if (!isModuleEnabled || isModuleEnabled && registry.get('CT_otp_submit_form') == "1") {
                registry.remove('CT_otp_submit_form');
                this._super(loginForm);
            }
        }
    };

    return function (target) {
        return target.extend(mixin);
    };
});

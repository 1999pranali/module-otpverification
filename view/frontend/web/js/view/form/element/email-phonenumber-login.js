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
    'ko',
    'Magento_Ui/js/form/form',
    'Magento_Customer/js/action/login',
    'Magento_Customer/js/customer-data',
    'Magento_Customer/js/model/authentication-popup',
    'mage/translate',
    'mage/url',
    'Magento_Ui/js/modal/alert',
    'mage/validation',
    'Coditron_OTPVerification/js/action/post',
    'Coditron_OTPVerification/js/model/full-screen-loader',
    'mage/template',
    'Coditron_OTPVerification/product/view/otpValidation',
    'Magento_Ui/js/model/messageList',
], function ($, ko, Component, loginAction, customerData, authenticationPopup, $t, url, alert, validation, sendPost, fullScreenLoader, mageTemplate, otpValidation, messageContainer) {
    'use strict';

    return Component.extend({
        requestUrl: 'otplogin/customer/loginconfig',
        otpModalPopupTemplateSelector: "#otpModalPopupTemplate",
        otpLoaderTemplateSelector: '#otpLoaderTemplate',
        modalClass: 'otpModalCustomer',
        otpResendBtnClass: 'otpResendBtn',
        normalizedformData: {},
        otpRequestData: {},
        otpValidationRequestData: {},
        config: {},
        submitForm: ko.observable(false),
        element: null,
        formDataBind: null,
        $form: null,
        $otpModalPopupTemplate: null,
        $otpLoaderTemplate: null,
        $otpModalWidget: null,
        $otpModalPopupContainer: null,
        $guestDetailsContainer: null,
        $guestDetailsContainerAddOn: null,
        $guestDetailsContainerForm: null,
        $guestDetailsContainerTelephone: null,
        $guestDetailsContainerEmailAddress: null,
        $guestDetailsContainerValidationError: null,
        $guestDetailsContainerSubmitBtn: null,
        $otpContainer: null,
        $otpContainerForm: null,
        $otpContainerResponseMessage: null,
        $otpContainerInput: null,
        $otpContainerValidationError: null,
        $otpContainerSubmitBtn: null,
        registerUrl: window.authenticationPopup.customerRegisterUrl,
        forgotPasswordUrl: window.authenticationPopup.customerForgotPasswordUrl,
        autocomplete: window.authenticationPopup.autocomplete,
        modalWindow: null,
        isLoading: ko.observable(false),
        loginDataForm: ko.observable([]),
        otpData: window.authenticationPopup.otp,
        defaults: {
            template: 'Coditron_OTPVerification/authentication-popup'
        },
        $sendOtpVia: null,

        /**
         * Init
         */
        initialize: function () {
            this.$otpModalPopupTemplate = $(mageTemplate(this.otpModalPopupTemplateSelector)({}));
            this.$otpLoaderTemplate = $(mageTemplate(this.otpLoaderTemplateSelector)({}));
            this.$otpModalPopupContainer = this.$otpModalPopupTemplate.closest('.otpModalContainer');
            this.$guestDetailsContainer = this.$otpModalPopupContainer.find('.guestDetailsContainer');
            this.$guestDetailsContainerAddOn = this.$otpModalPopupContainer.find('.addon');
            this.$guestDetailsContainerForm = this.$guestDetailsContainer.find('.guestDetailsContainer-form');
            this.$guestDetailsContainerTelephone = this.$guestDetailsContainer.find('.guestDetailsContainer-telephone');
            this.$guestDetailsContainerEmailAddress = this.$guestDetailsContainer.find('.guestDetailsContainer-emailAddress');
            this.$guestDetailsContainerValidationError = this.$guestDetailsContainer.find('.guestDetailsContainer-validationError');
            this.$guestDetailsContainerSubmitBtn = this.$guestDetailsContainer.find(".guestDetailsContainer-submitBtn");

            this.$otpContainer = this.$otpModalPopupContainer.find('.otpContainer');
            this.$otpContainerForm = this.$otpContainer.find('.otpContainer-form');
            this.$otpContainerResponseMessage = this.$otpContainer.find('.otpContainer-responseMessage');
            this.$otpContainerInput = this.$otpContainer.find('.otpContainer-input');
            this.$otpContainerValidationError = this.$otpContainer.find('.otpContainer-validationError');
            this.$otpContainerSubmitBtn = this.$otpContainer.find('.otpContainer-submitBtn');
            this.$otpContainerSubmitBtn.html(this.otpData.submitButtonText);

            this.$otpContainerForm.otpValidation({});
            this.$guestDetailsContainer.otpValidation({});
            var self = this;

            // Validate Otp
            this.$otpContainerSubmitBtn.click(function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                if (!this.$otpContainerForm.validation() || !this.$otpContainerForm.validation('isValid')) {
                    return false;
                }
                var otp = this.$otpContainerInput.val();
                if (otp && $.isNumeric(otp) && otp > 0 && this.$sendOtpVia == "mobile") {
                    const code = otp;
                    var status = 0;
                    fullScreenLoader.startLoader();
                    $('body').trigger('processStart');
                    var newDate = new Date();
                    var expirytime = window.otpcreatetime + this.otpData.optExpireTimeInMilliSec;
                    var currenttime = newDate.getTime();
                    if(currenttime >= expirytime) {
                        this.$otpContainerValidationError
                            .removeClass('display-none')
                            .html($t('OTP expired. Please resend OTP and try again.'));
                        fullScreenLoader.stopLoader();
                        $('body').trigger('processStop');
                        return false;
                    }
                    confirmationResult.confirm(code).then((result) => {
                        // User signed in successfully.
                        const user = result.user;
                        status = 1;
                        this.$otpModalWidget
                        .modal('closeModal');
                        $('body').trigger('processStop');
                        loginAction(this.loginDataForm());
                        
                        // ...
                      }).catch((error) => {
                        console.log(error);
                        if (status==0) {
                            fullScreenLoader.stopLoader();
                            $('body').trigger('processStop');
                            alert({
                                title: $.mage.__('Authentication Error'),
                                content: $.mage.__('Incorrect OTP provided')
                            });
                            this.$otpContainerValidationError
                                    .removeClass('display-none')
                                    .html('incorrect otp provided');
                        }
                        // User couldn't sign in (bad verification code?)
                        // ...
                      });
                } else if (otp && $.isNumeric(otp) && otp > 0 && this.$sendOtpVia == "email") {
                    alert("In email-phone number login js");
                    this.otpValidationRequestData = this.getDataForOtpValidation(otp);
                    $('body').trigger('processStart');
                    sendPost(this.otpValidationRequestData, this.otpData.validateCustomerOtpUrl, false)
                        .done(function(response){
                             if (response.error) {
                                this.$otpContainerValidationError
                                    .removeClass('display-none')
                                    .html(response.message);
                                    messageContainer.addErrorMessage({ message: response.message });
                             } else {
                                this.$otpContainerValidationError
                                    .addClass('display-none');
                                this.$otpContainerResponseMessage
                                    .addClass('success')
                                    .html(response.message);
                                this.$otpModalWidget
                                    .modal('closeModal');
                                loginAction(this.loginDataForm());
                             }
                        }.bind(this)).fail(function(){
                            this.$otpContainerValidationError
                                .removeClass('display-none')
                                .html(this.otpData.validateNumberError);
                        }.bind(this)).always(function(){
                            $('body').trigger('processStop');
                        }.bind(this));
                } else {
                    this.$otpContainerValidationError
                        .removeClass('display-none')
                        .html(this.otpData.validateNumberError);
                }
            }.bind(this));

            this.$otpModalWidget = this.$otpModalPopupContainer.modal({
                buttons: [{
                    text: this.otpData.resendText,
                    class: this.otpResendBtnClass + ' display-none',
                    click: function () {
                        if (!_.isEmpty(this.otpRequestData) && this.otpRequestData.hasOwnProperty('resend')) {
                            this.otpRequestData.resend = 1;
                            if(this.$sendOtpVia == "email") {
                                this.sendOtpToEmail();
                            } else if(this.$sendOtpVia == "mobile") {
                                this.sendOtpToPhone();
                            }
                        }
                    }.bind(self)
                }],
                opened: function () {
                    this.$otpModalPopupContainer.removeClass('display-none');
                }.bind(self),
                closed: function () {
                    this.$otpModalPopupContainer.addClass('display-none');
                    this.$guestDetailsContainerTelephone.val('');
                    this.$guestDetailsContainerEmailAddress.val('');
                    this.$otpContainerInput.val('');
                    this.$otpContainer.addClass('display-none');
                    this.$guestDetailsContainerForm.validation().validation('clearError');
                    this.$guestDetailsContainerForm.find('.mage-error').removeClass('mage-error');
                    this.$otpContainerForm.validation().validation('clearError');
                    this.$otpContainerForm.find('.mage-error').removeClass('mage-error');
                }.bind(self),
                modalClass: this.modalClass,
                clickableOverlay: false,
                type: 'popup',
                title: this.otpData.modalTitle,
            });

            this._super();
            url.setBaseUrl(window.authenticationPopup.baseUrl);
            loginAction.registerLoginCallback(function () {
            });
        },

        /** Init popup login window */
        setModalElement: function (element) {
            if (authenticationPopup.modalWindow == null) {
                authenticationPopup.createPopUp(element);
            }
        },

        /**
         * Get Data for Otp Validation
         * @param {Number|String} otp 
         * @returns {Object}
         */
        getDataForOtpValidation: function(otp) {
            return {
                'form_key': $.mage.cookies.get('form_key'),
                'email': this.otpRequestData.email,
                'otp': otp,
            };
        },

        /** Is login form enabled for current customer */
        isActive: function () {
            var customer = customerData.get('customer');

            return customer() == false; //eslint-disable-line eqeqeq
        },

        /** Show login popup window */
        showModal: function () {
            if (this.modalWindow) {
                $(this.modalWindow).modal('openModal');
            } else {
                alert({
                    content: $t('Guest checkout is disabled.')
                });
            }
        },

        /**
         * Provide login action
         *
         * @return {Boolean}
         */
        login: function (formUiElement, event) {
            var loginData = {},
                formElement = $(event.currentTarget),
                formDataArray = formElement.serializeArray();

            event.stopPropagation();
            formDataArray.forEach(function (entry) {
                loginData[entry.name] = entry.value;
            });
            loginData['customerLoginUrl'] = window.authenticationPopup.customerLoginUrl;
            if (formElement.validation() &&
                formElement.validation('isValid')
            ) {
                this.loginDataForm(loginData);

                if (this.otpData.isEnableAtLogin == 1 && this.otpData.isModuleEnabled == 1) {
                    this.otpModel(formDataArray);

                    if(this.otpData.forOthersSendOtpVia == "email") {
                        this.$otpContainer
                                .find('.otpContainer-expireMessage')
                                .html(this.otpData.otpTimeToExpireMessage);
                        this.$sendOtpVia = 'email';
                    } else if(this.otpData.forOthersSendOtpVia == "mobile") {
                        this.$sendOtpVia = 'mobile';
                    } else if(this.otpData.forOthersSendOtpVia == "both") {
                        var inputValue;
                        inputValue = this.loginDataForm().username;
                        if (inputValue.includes("@")) {
                            this.$otpContainer
                                .find('.otpContainer-expireMessage')
                                .html(this.otpData.otpTimeToExpireMessage);
                            this.$sendOtpVia = 'email';
                        }
                        else {
                            this.$otpContainer
                                .find('.otpContainer-expireMessage')
                                .html('');
                            this.$sendOtpVia = 'mobile';
                        }
                    }
                } else {
                    loginAction(loginData);
                }
            }

            return false;
        },

        /**
         * Returns the data for sending otp
         * @param {Object} customer
         * @param {Number|Boolean} resendFlag
         * @returns {Object}
         */
        getOtpRequestData: function(customer, resendFlag) {
            return {
                'name': customer.firstname,
                'form_key': $.mage.cookies.get('form_key'),
                'email': customer.email,
                'resend': resendFlag,
                'mobile': customer.customerData.default_phone_number,
                'region': customer.countryId,
                'shouldCheckExistingAccount': 0,
            };
        },

        /**
         * 
         * @param {*} formElement
         */
        otpModel: function (formElement) {
            this.normalizedFormData = this.normalizeFormData(formElement);
                    // fullScreenLoader.startLoader();
                    sendPost(this.normalizedFormData, this.otpData.validateCustomerCredentialsUrl, false)
                        .done(function(response) {
                            if (!_.isEmpty(response) && response.hasOwnProperty('error') && response.error) {
                                customerData.set('messages', {
                                    messages: [{
                                        type: 'error',
                                        text: response.message
                                    }]
                                });
                                messageContainer.addErrorMessage({ message: response.message });
                                $("#pass").val('');
                            } else if (
                                !_.isEmpty(response) &&
                                response.hasOwnProperty('error') &&
                                !response.error &&
                                response.hasOwnProperty('data') &&
                                !_.isEmpty(response.data)
                            ) {
                                
                                this.otpRequestData = this.getOtpRequestData(response.data, 0);
                                if(this.$sendOtpVia == "email") {
                                    this.sendOtpToEmail();
                                } else if(this.$sendOtpVia == "mobile") {
                                    // fullScreenLoader.stopLoader();
                                    this.sendOtpToPhone();
                                }
                            }
                            
                        }.bind(this)).fail(function() {
                            
                            // this.submitForm(true);
                        }.bind(this)).always(function(){
                            // fullScreenLoader.stopLoader();
                        }.bind(this));
        },

        /**
         * 
         * @param {*} loginData 
         * @returns 
         */
        normalizeFormData: function(loginData) {
            var normalizedFormData = {};
            loginData.forEach(function (field) {
                if (field.hasOwnProperty('login')) {
                    field.login.forEach(function (nestedField) {
                        normalizedFormData[nestedField.name] = nestedField.value;
                    });
                } else {
                    var normalizedFieldName = field.name.replace(/^[^\[]+\[(?<fieldName>[^\]]+)]$/, '$<fieldName>');
                    if (normalizedFieldName) {
                        field = {
                            name: normalizedFieldName,
                            value: field.value, 
                        };
                    }
                    if (field.name === 'email') {
                        normalizedFormData.username = field.value;
                        normalizedFormData.password = '';
                    } else {
                        normalizedFormData[field.name] = field.value;
                    }
                }
            }, this);
            if (!normalizedFormData.hasOwnProperty('form_key')) normalizedFormData.form_key = $.mage.cookies.get('form_key'); 
            return normalizedFormData;
        },

        /**
         * Send otp request 
         */
        sendOtpToEmail: function() {
            this.prepareOtpModalForRendering();
            // fullScreenLoader.startLoader();
            $('body').trigger('processStart');
            sendPost(this.otpRequestData, this.otpData.otpAction, false)
                .done(function (response) {
                    if (response.error) {
                        this.$guestDetailsContainerValidationError
                            .html(response.message)
                            .removeClass('display-none');
                        this.$guestDetailsContainer.removeClass('display-none');
                        this.$guestDetailsContainerAddOn.addClass('display-none');
                        this.$otpContainer.addClass('display-none');
                    } else {
                        
                        this.$otpContainerResponseMessage
                            .addClass('success')
                            .html(response.message);
                        this.$otpModalPopupContainer
                            .parents('.' + this.modalClass)
                            .find('.' + this.otpResendBtnClass)
                            .removeClass('display-none');
                        this.$guestDetailsContainer.addClass('display-none');
                        this.$otpContainer.removeClass('display-none');
                        this.$otpContainerValidationError.addClass('display-none');
                    }
                }.bind(this)).fail(function () {
                    this.$guestDetailsContainerValidationError
                        .html($t('Unable to send Otp. Please try again later.'))
                        .removeClass('display-none');
                    this.$otpContainer.addClass('display-none');
                    this.$guestDetailsContainer.removeClass('display-none');
                    messageContainer.addErrorMessage({ message: 'Unable to send Otp. Please try again later.' });
                }.bind(this)).always(function () {
                    
                    $('body').trigger('processStop');
                    if (this.otpRequestData.resend != "1") {
                        this.$otpModalWidget.modal('openModal');
                    }
                }.bind(this));
        },

        /**
         * Send otp request to phone
         */
        sendOtpToPhone: function() {
            window.defaultSignInSubmit(this.loginDataForm().username);
            this.prepareOtpModalForRendering();
            $('body').trigger('processStart');
            if(this.otpRequestData.resend) {
                this.$otpContainerResponseMessage
                            .addClass('success')
                            .html($t('A new OTP has been sent to your mobile number'));
            } else {
                this.$otpContainerResponseMessage
                            .addClass('success')
                            .html($t('Your OTP has been sent to your mobile number'));
            }
            this.$otpModalPopupContainer
                .parents('.' + this.modalClass)
                .find('.' + this.otpResendBtnClass)
                .removeClass('display-none');
            this.$guestDetailsContainer.addClass('display-none');
            this.$otpContainer.removeClass('display-none');
            this.$otpContainerValidationError.addClass('display-none');
            $('body').trigger('processStop');
            this.$otpModalWidget.modal('openModal');
        },

        /**
         * Prepare Otp Modal for rendering.
         */
        prepareOtpModalForRendering: function() {
            if (this.otpData.isMobileOtpEnabled) {
                
                if (!this.otpData.isSendOtpEmailEnabled) {
                    this.$guestDetailsContainerEmailAddress
                        .removeAttr('data-validate')
                        .closest('.addon')
                        .addClass('display-none');
                    this.$guestDetailsContainerTelephone
                        .attr(
                            'data-validate',
                            '{required: true, "CT-otp-telephone": true}'
                        )
                        .closest('.addon')
                        .removeClass('display-none')
                        .find('label')
                        .addClass('CT-otp-required');
                } else {
                    this.$guestDetailsContainerEmailAddress
                        .attr(
                            'data-validate',
                            '{required: true, "validate-email": true}'
                        )
                        .closest('.addon')
                        .removeClass('display-none')
                        .find('label')
                        .addClass('CT-otp-required');
                    this.$guestDetailsContainerTelephone
                        .attr(
                            'data-validate',
                            '{"CT-otp-telephone": true}'
                        )
                        .closest('.addon')
                        .removeClass('display-none')
                        .find('label')
                        .removeClass('CT-otp-required');
                }
            } else {
                
                this.$guestDetailsContainerEmailAddress
                    .attr(
                        'data-validate',
                        '{required: true, "validate-email": true}'
                    )
                    .closest('.addon')
                    .removeClass('display-none')
                    .find('label')
                    .addClass('CT-otp-required');
                this.$guestDetailsContainerTelephone
                    .removeAttr('data-validate')
                    .closest('.addon')
                    .addClass('display-none');
            }
        },

        /**
         * Returns Username Field Label
         * 
         * @returns {String}
         */
        getUsernameLabel: function () {
            return ko.computed(function () {
                if (window.authenticationPopup.hasOwnProperty('usernameFieldConfig')) {
                    return window.authenticationPopup.usernameFieldConfig.label;
                }

                return 'Email';
            });
        },

        /**
         * @returns {String}
         */
        getUsernameDataValidate: function () {
            return ko.computed(function () {
                if (window.authenticationPopup.hasOwnProperty('usernameFieldConfig')) {
                    return window.authenticationPopup.usernameFieldConfig.dataValidate;
                }
                return '{required: true, "validate-email": true}';
            });
        },

        /**
         * @returns {String}
         */
        getUsernameType: function () {
            return ko.computed(function () {
                if (window.authenticationPopup.hasOwnProperty('usernameFieldConfig')) {
                    return window.authenticationPopup.usernameFieldConfig.type;
                }

                return 'email';
            });
        },
    });
});

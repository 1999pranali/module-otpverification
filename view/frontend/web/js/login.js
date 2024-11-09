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
    'uiComponent',
    'Magento_Ui/js/modal/alert',
    'mage/template',
    'Coditron_OTPVerification/js/action/post',
    'Coditron_OTPVerification/js/model/full-screen-loader',
    'mage/translate',
    'ko',
    'uiRegistry',
    'underscore',
    'Coditron_OTPVerification/product/view/otpValidation',
    'Magento_Customer/js/customer-data',
    'mage/cookies',
    'mage/mage',
    'domReady!'
], function ($, Component, alert, mageTemplate, sendPost, fullScreenLoader, $t, ko, registry, _, otpValidation,customerData) {
    'use strict';

    return Component.extend({
        otpModalPopupTemplateSelector: "#otpModalPopupTemplate",
        otpLoaderTemplateSelector: '#otpLoaderTemplate',
        modalClass: 'otpModalCustomer',
        otpResendBtnClass: 'otpResendBtn',
        otpResentBtnPhoneClass: 'otpContainer-resendBtn',
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
        $customerInput: null,
        $otpContainerValidationError: null,
        $otpContainerSubmitBtn: null,
        resendStatus: null,
        $sendOtpVia: null,
        incorrectOtpCount: 0, // Initialize the counter
        maxIncorrectAttempts: 3,

        initialize: function (config, element) {
            if (_.isEmpty(config)) return;
            config.isModuleEnabled = Number(config.isModuleEnabled);
            config.isMobileOtpEnabled = Number(config.isMobileOtpEnabled);
            config.isSendOtpEmailEnabled = Number(config.isSendOtpEmailEnabled);
            if (!config.isModuleEnabled) return;
            this.config = config;
            this.element = element;
            this.$otpModalPopupTemplate = $(mageTemplate(this.otpModalPopupTemplateSelector)({}));
            this.$otpLoaderTemplate = $(mageTemplate(this.otpLoaderTemplateSelector)({}));
            $('body').append(this.$otpModalPopupTemplate);
            $('body').append(this.$otpLoaderTemplate);
            this.$form = $(element).is('form') ? $(element) : $(element).find('form');
            this.formDataBind = this.$form.attr('data-bind');
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
            this.$otpContainerSubmitBtn.html(config.submitButtonText);

            this.$otpContainerForm.otpValidation({});
            this.$guestDetailsContainer.otpValidation({});
            this.resendStatus = 0;

            this.$guestDetailsContainerSubmitBtn
                .html(config.submitButtonText);
            if(config.forOthersSendOtpVia == "email") {
                this.$otpContainer
                    .find('.otpContainer-expireMessage')
                    .html(config.otpTimeToExpireMessage);
            }
            this.$guestDetailsContainerTelephone
                .attr('placeholder', config.telephoneInputPlaceholder);
            this.$otpContainerInput
                .attr('placeholder', config.otpInputPlaceholder);

            fullScreenLoader.setContainerId('#' + this.$otpLoaderTemplate.attr('id'));
            fullScreenLoader.setIcon(config.loaderUrl);

            var self = this;
            this.submitForm.subscribe(function(newValue){
                if (newValue) {
                    registry.set('CT_otp_submit_form', 1);
                    if (!_.isEmpty(this.otpRequestData)) {
                        var $clonnedForm = this.$form.clone(true),
                            emailFieldName = $clonnedForm.find('[name="email"]').length
                                ? 'email'
                                : ($clonnedForm.find('[name="username"]').length 
                                    ? 'username'
                                    : 'login[username]');
                        $clonnedForm
                            .addClass('display-none')
                            .find('[name="' + emailFieldName + '"]')
                            .val(this.otpRequestData.email);
                        this.$form.parent().append($clonnedForm);
                        $clonnedForm.trigger('submit');
                        _.defer(function(){
                            $clonnedForm.remove();
                        }.bind(this), 100);  
                    } else {
                        this.$form.trigger('submit');
                    }
                    _.defer(function () { this.submitForm(false); }.bind(this), 100);
                } else {
                    registry.remove('CT_otp_submit_form');
                }
            }.bind(this));

            this.$otpModalWidget = this.$otpModalPopupContainer.modal({
                buttons: [{
                    text: config.resendText,
                    class: this.otpResendBtnClass + ' display-none',
                    click: function () {
                        if (!_.isEmpty(this.otpRequestData) && this.otpRequestData.hasOwnProperty('resend')) {
                            this.otpRequestData.resend = 1;
                            if(this.$sendOtpVia == "mobile") {
                                this.resendStatus = 1;
                                this.sendOtpToPhone();
                            } else if(this.$sendOtpVia == "email") {
                                this.sendOtpToEmail();
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
                title: config.modalTitle,
            });
            this.$form.on('submit', function (event) {
                if (!this.submitForm()) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    
                    if (!this.$form.validation() || !this.$form.validation('isValid')) {
                        return false;
                    }
                    this.normalizedformData = this.normalizeFormData(this.$form.serializeArray());
                    fullScreenLoader.startLoader();
                    sendPost(this.normalizedformData, config.validateCustomerCredentialsUrl, false)
                        .done(function(response) {
                            
                            if (!_.isEmpty(response) && response.hasOwnProperty('error') && response.error) {
                                customerData.set('messages', {
                                    messages: [{
                                        type: 'error',
                                        text: response.message
                                    }]
                                });
                                $("#pass").val('');

                            } else if (
                                !_.isEmpty(response) &&
                                response.hasOwnProperty('error') &&
                                !response.error &&
                                response.hasOwnProperty('data') &&
                                !_.isEmpty(response.data)
                            ) {
                                
                                this.otpRequestData = this.getOtpRequestData(response.data, 0);
                                // this.sendOtp();
                                if(this.$sendOtpVia == "email") {
                                    this.sendOtpToEmail();
                                } else if(this.$sendOtpVia == "mobile") {
                                    this.sendOtpToPhone();
                                }
                            }
                            
                        }.bind(this)).fail(function() {
                            
                            // this.submitForm(true);
                        }.bind(this)).always(function(){
                            fullScreenLoader.stopLoader();
                        }.bind(this));
                }
            }.bind(this));

            function enableModalButtons(enable) {
                var buttons = $('.otpResendBtn');
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = !enable;
                }
            }
            var countdownInterval;
            function startCountdown() {
            	if(self.incorrectOtpCount !== 0)
            	{
            		self.$otpContainerInput.prop('disabled', false); // enable the input box
    			    self.$otpContainerSubmitBtn.prop('disabled', false); // enable the submit button
                	self.incorrectOtpCount = 0; 
            	}
            	  
                // Clear any existing interval
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    var countdownElements = $('.otp_countdown');
                    for (var i = 0; i < countdownElements.length; i++) {
                        countdownElements[i].textContent = ""; // Clear the previous countdown content
                    }
                }

                enableModalButtons(false);
                var otpExpireTime = config.optExpireTimeInMilliSec; // OTP expiry time in milliseconds
                var countdownElements = $('.otp_countdown');
                var expireMessageElements = $('.otp_expire_message');

                for (var i = 0; i < expireMessageElements.length; i++) {
                    expireMessageElements[i].style.display = 'block';
                }

                var countdownTime = otpExpireTime / 1000; // Convert to seconds

                countdownInterval = setInterval(function() {
                    var minutes = Math.floor(countdownTime / 60);
                    var seconds = countdownTime % 60;
                    seconds = seconds < 10 ? '0' + seconds : seconds;
                    for (var i = 0; i < countdownElements.length; i++) {
                        countdownElements[i].textContent = minutes + "min : " + seconds + "sec";
                    }
                    if (countdownTime-- <= 0) {
                        clearInterval(countdownInterval);
                        if(self.incorrectOtpCount !== self.maxIncorrectAttempts)
            		    {
                        	enableModalButtons(true);
                        }
                        for (var i = 0; i < countdownElements.length; i++) {
                            countdownElements[i].textContent = "OTP expired. Please resend the OTP"; // OTP expired
                        }
                        for (var i = 0; i < expireMessageElements.length; i++) {
                            expireMessageElements[i].style.display = 'none';
                        }
                    }
                }, 1000);
            }

            $('.otpResendBtn').on('click', function(event) {
                startCountdown.call(self);
            });

            $(document).on('click', '.otpAuthElement', function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                var $otpAuthElement = $(event.currentTarget);

                if(config.forOthersSendOtpVia == "email") {
                    this.$sendOtpVia = 'email';
                } else if(config.forOthersSendOtpVia == "mobile") {
                    this.$sendOtpVia = 'mobile';
                } else if(config.forOthersSendOtpVia == "both") {
                    var inputValue;
                    if($("#email").length) {
                        inputValue = document.getElementById('email').value;
                    } else if($("#email_address").length) {
                        inputValue = document.getElementById('email_address').value;
                    }else {
                        inputValue = document.getElementById('login-email').value;
                    }
                    if (inputValue.includes("@")) {
                        this.$otpContainer
                            .find('.otpContainer-expireMessage')
                            .html(config.otpTimeToExpireMessage);
                        this.$sendOtpVia = 'email';
                    }
                    else {
                        this.$otpContainer
                            .find('.otpContainer-expireMessage')
                            .html('');
                        this.$sendOtpVia = 'mobile';
                    }
                }
                startCountdown.call(self);
                enableModalButtons(false);
                $otpAuthElement.closest('form').trigger('submit');
            }.bind(this));

            // Send Otp
            this.$guestDetailsContainerSubmitBtn.click(function (event) {
                event.preventDefault();
                if (!this.$guestDetailsContainerForm.validation()|| !this.$guestDetailsContainerForm.validation('isValid')) {
                    return false;
                }
                if (!_.isEmpty(this.otpRequestData) &&  this.otpRequestData.hasOwnProperty('resend') &&
                    this.otpRequestData.hasOwnProperty('mobile') && this.otpRequestData.hasOwnProperty('email')
                ) {
                    this.otpRequestData.resend = 0;
                    this.$guestDetailsContainerEmailAddress.val(this.otpRequestData.email);
                    this.$guestDetailsContainerTelephone.val(this.otpRequestData.mobile);
                    if(config.forOthersSendOtpVia == "mobile") {
                        this.sendOtpToPhone();
                    } else if(config.forOthersSendOtpVia == "email") {
                        this.sendOtpToEmail();
                    }
                }
            }.bind(this));

            // Validate Otp
            this.$otpContainerSubmitBtn.click(function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                // Check if maximum incorrect attempts have been reached

                if (this.incorrectOtpCount >= this.maxIncorrectAttempts) {
                    this.$otpContainerValidationError
                        .removeClass('display-none')
                        .html($t('You have entered incorrect OTP more than 3 times. Please try again later.'));
                    this.$otpContainerInput.prop('disabled', true); // Disable the input box
                    this.$otpContainerSubmitBtn.prop('disabled', true); // Disable the submit button
                    enableModalButtons(false);
                    return false;

                }
                if (!this.$otpContainerForm.validation() || !this.$otpContainerForm.validation('isValid')) {
                    return false;
                }
                var otp = this.$otpContainerInput.val();
                if (otp && $.isNumeric(otp) && otp > 0 && this.$sendOtpVia == "mobile") {
                    const code = otp;
                    var status = 0;
                    fullScreenLoader.startLoader();
                    var newDate = new Date();
                    var expirytime = window.otpcreatetime + this.config.optExpireTimeInMilliSec;
                    var currenttime = newDate.getTime();
                    if(currenttime >= expirytime) {
                        this.$otpContainerValidationError
                            .removeClass('display-none')
                            .html($t('OTP expired. Please resend OTP and try again.'));
                        fullScreenLoader.stopLoader();
                        return false;
                    }
                    confirmationResult.confirm(code).then((result) => {
                        // User signed in successfully.
                        const user = result.user;
                        status = 1;
                        this.$otpModalWidget
                                .modal('closeModal');
                        fullScreenLoader.stopLoader();
                        this.submitForm(true);
                        // ...
                      }).catch((error) => {
                        console.log(error);
                        if (status==0) {
                            fullScreenLoader.stopLoader();
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
                    this.otpValidationRequestData = this.getDataForOtpValidation(otp);
                    fullScreenLoader.startLoader();
                    sendPost(this.otpValidationRequestData, config.validateCustomerOtpUrl, false)
                        .done(function(response){
                             if (response.error) {
                                this.$otpContainerValidationError
                                    .removeClass('display-none')
                                    .html(response.message);
                                this.incorrectOtpCount++;
                             } else {
                                this.$otpContainerValidationError
                                    .addClass('display-none');
                                this.$otpContainerResponseMessage
                                    .addClass('success')
                                    .html(response.message);
                                this.$otpModalWidget
                                    .modal('closeModal');
                                this.submitForm(true);
                             }
                        }.bind(this)).fail(function(){
                            this.$otpContainerValidationError
                                .removeClass('display-none')
                                .html(config.validateNumberError);
                            this.incorrectOtpCount++;
                        }.bind(this)).always(function(){
                            fullScreenLoader.stopLoader();
                        }.bind(this));
                } else {
                    this.$otpContainerValidationError
                        .removeClass('display-none')
                        .html(config.validateNumberError);
                    this.incorrectOtpCount++;
                }
            }.bind(this));

            // Keydown event
            this.$otpContainerInput.keydown(function (e) {
                if ($.inArray(e.keyCode, [46, 8, 9, 13, 27, 110]) !== -1 ||
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    (e.keyCode >= 35 && e.keyCode <= 40)
                ) {
                    return;
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        },

        /**
         * Prepare Otp Modal for rendering.
         */
        prepareOtpModalForRendering: function() {
            if (this.config.isMobileOtpEnabled) {
                
                if (!this.config.isSendOtpEmailEnabled) {
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
         * Returns the data for sending otp
         * @param {Object} customer
         * @param {Number|Boolean} resendFlag
         * @returns {Object}
         */
        getOtpRequestData: function(customer, resendFlag) {
            var forgetpassword = false;
            if (this.config.forgetpassword) {
                forgetpassword = true;
            }
            return {
                'name': customer.firstname,
                'form_key': $.mage.cookies.get('form_key'),
                'email': customer.email,
                'resend': resendFlag,
                'mobile': customer.customerData.default_phone_number,
                'region': customer.countryId,
                'shouldCheckExistingAccount': 0,
                'forgetpassword': forgetpassword,
            };
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

        /**
         * Send otp request to phone
         */
        sendOtpToPhone: function() {
            window.signInSubmit();
            this.prepareOtpModalForRendering();
            fullScreenLoader.startLoader();
            if(this.resendStatus) {
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
            this.$otpContainer
                .find('.otpContainer-expireMessage')
                .html(this.config.otpTimeToExpireMessage);
            fullScreenLoader.stopLoader();
            this.$otpModalWidget.modal('openModal');
        },

        /**
         * Send otp request to Email
         */
        sendOtpToEmail: function() {
            this.prepareOtpModalForRendering();
            fullScreenLoader.startLoader();
            sendPost(this.otpRequestData, this.config.otpAction, false)
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
                }.bind(this)).always(function () {
                    
                    fullScreenLoader.stopLoader();
                    if (this.otpRequestData.resend != "1") {
                        this.$otpModalWidget.modal('openModal');
                    }
                }.bind(this));
        }
    });
});

/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

/*jshint jquery:true*/
define(
    [
        'jquery',
        'Magento_Ui/js/modal/alert',
        'mage/translate',
        'mage/cookies',
        'loader'      
    ],
    function($,alert,$t) {
        'use strict';
        return function(config, element) {
            var otpModalPopup = $(element),
                resendOtp,
                ajaxRequest,
                ajaxValidate,
                otpPopup = otpModalPopup.find('.otp_popup'),
                otpResponse = otpPopup.find('.otp_response'),
                otpExpireMessage = otpPopup.find('.otp_expire_message'),
                otpTimerMessage = otpPopup.find('.otp_countdown'),
                otpAction = otpPopup.find('.otp_action'),
                customerRegisterForm = $('#form-validate'),
                otpLoader = otpModalPopup.siblings('.otpLoader').loader({
                    icon: config.loaderUrl,
                }),
                validateError = otpPopup.find('.validate_error'),
                customerRegisterFormSubmitBtn = $('.action.submit.primary'),
                userOtp = otpAction.find('.user_otp'),
                submitOtp = otpAction.find('.submit_otp'),
                otpResendClass = 'otp_resend',
                otpModalPopupClass = 'otp_modal_popup',
                incorrectOtpCount= 0, // Initialize the counter
                maxIncorrectAttempts= 3,
                modalPopup = otpModalPopup.modal({
                    buttons: [{
                        text: config.resendText,
                        class: otpResendClass,
                        click: function() {
                            otpLoader.loader('show');
                            if (config.isB2BMarketplaceModuleEnable && $('.CT-firebaseotp-btn').length > 0) {
                                sendOtpAjax(1);
                            } else if (customerRegisterForm.valid()) {
                                sendOtpAjax(1);
                            }
                        }
                    }],
                    modalClass: otpModalPopupClass,
                    clickableOverlay: false,
                    type: 'popup',
                    title: config.modalTitle
                });
            if (config.isB2BMarketplaceModuleEnable && $('.CT-register-btn').length > 0) {
                $('.CT-register-btn').addClass('CT-firebaseotp-btn');
                $('.CT-firebaseotp-btn').removeClass('CT-register-btn');
                var supplierRegisterFormSubmitBtn = $('.CT-firebaseotp-btn');
                supplierRegisterFormSubmitBtn.click( function(event) {
                    otpResponse.removeClass('success');
                    otpResponse.removeClass('error');
                    otpLoader.loader('show');
                    event.preventDefault();
                    sendOtpAjax();
                });
            }
            
            /**
             * Function to prevent typing alphabets and special character in otp input box
             */
            userOtp.keydown(function(e) {
                // Allow: backspace, delete, tab, escape and .
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 110]) !== -1 ||
                    // Allow: Ctrl+A, Command+A
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    // Allow: home, end, left, right, down, up
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    // let it happen, don't do anything
                    return;
                }
                // On Enter key validate OTP
                if (e.keyCode === 13) {
                    submitOtp.trigger('click');
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });

            function enableModalButtons(enable) {
                var buttons = otpModalPopup.closest('.' + otpModalPopupClass).find('button.otp_resend');
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].disabled = !enable;
                }
            }
            var countdownInterval;
            function startCountdown() {
                if(self.incorrectOtpCount !== 0)
                {
                    userOtp.prop('disabled', false); // enable the input box
                    submitOtp.prop('disabled', false); // enable the submit button
                    incorrectOtpCount = 0; 
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
                        if(incorrectOtpCount !== maxIncorrectAttempts)
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

            customerRegisterFormSubmitBtn.on('click', function(event) {
                if (customerRegisterForm.valid()) {
                    otpResponse.removeClass('success');
                    otpResponse.removeClass('error');
                    otpLoader.loader('show');
                    event.preventDefault();
                    startCountdown();
                    enableModalButtons(false);
                    sendOtpAjax();
                }
            });

            resendOtp = otpModalPopup
                .closest('.' + otpModalPopupClass)
                .find('button.otp_resend');

            submitOtp.on('click', function() {
                validateError.addClass('display-none');
                var otp = userOtp.val();
                if (otp != "" && $.isNumeric(otp) && otp > 0) {
                    otpLoader.loader('show');
                    validateOtp();
                } else {
                    validateError
                        .html("<span>" + config.validateNumberError + "</span>")
                        .removeClass('display-none');
                }
            });

            $('.' + otpResendClass).on('click', function(event) {
                startCountdown();
            });


            /**
             * Function to Send the Otp to the user
             */
            function sendOtpAjax(resendFlag = 0) {
                if(config.sendOtpVia == "mobile" ) {
                    var phone = 0;
                    if (config.isB2BMarketplaceModuleEnable && $('.CT-firebaseotp-btn').length > 0) {
                        var dataForm = $('#CT-supplier-create-form');
                        dataForm.mage('validation', {});
                        if (dataForm.validation('isValid')) { 
                            phone = $('#supplier-phone').val();
                            if (!phone.includes("+")) {
                                alert({
                                    title: $.mage.__('Incorrect phone number format.'),
                                    content: $.mage.__('Phone number should contain country code.')
                                });
                                otpLoader.loader('hide');
                                return;
                            }
                        } else {
                            otpLoader.loader('hide');
                            return;
                        }
                    }
                    window.signInSubmit(phone);
                    otpAction.show();
                    otpExpireMessage.removeClass('CT-otp-display-none');
                    otpTimerMessage.removeClass('CT-otp-display-none');
                    validateError.addClass('display-none');
                    if(resendFlag) {
                        otpResponse
                        .addClass('success')
                        .html($t('A new OTP has been sent to your mobile number'));
                    } else {
                        otpResponse
                        .addClass('success')
                        .html($t('Your OTP has been sent to your mobile number'));
                    }
                    otpLoader.loader('hide');
                    modalPopup.modal('openModal');
                } else if(config.sendOtpVia == "email") {
                    if (ajaxRequest && ajaxRequest.readyState != 4) {
                        ajaxRequest.abort();
                    }
                    if ($('.CT-firebaseotp-btn').length > 0) {
                        var email = $('#supplier-email').val();
                        var name = $('#supplier-first-name').val();
                    } else {
                        var email = $('#email_address').val();
                        var name = $('#firstname').val();
                    }
                    var formKey = $.mage.cookies.get('form_key');
                    if (config.isMobileOtpEnabled != "0" && config.isMobileOtpEnabled != " " && config.isMobileOtpEnabled) {
                        var countryCode = $('#country_codes').val(),
                            mobile = countryCode + $('#mobile').val();
                    }
    
                    ajaxRequest = jQuery.ajax({
                        url: config.otpAction,
                        data: {
                            'email': email,
                            'name': name,
                            'resend': resendFlag,
                            'form_key': formKey,
                            'mobile': mobile,
                            'registration' : true,
                        },
                        showLoader: true,
                        async: true,
                        type: 'POST',
                    }).done(function(result) {
                        otpLoader.loader('hide');
                        if (result.error) {
                            $('html, body').animate({ scrollTop: 0 }, "slow"); // scroll to page top
                            validateError
                                .removeClass('display-none')
                                .html("<span>" + result.message + "</span>");
                            otpAction.hide();
                            otpExpireMessage.addClass('CT-otp-display-none');
                            otpTimerMessage.addClass('CT-otp-display-none');
                            resendOtp.addClass('CT-otp-display-none');
                        } else {
                            otpAction.show();
                            otpExpireMessage.removeClass('CT-otp-display-none');
                            otpTimerMessage.removeClass('CT-otp-display-none');
                            validateError.addClass('display-none')
                            otpResponse
                                .addClass('success')
                                .html(result.message);
                            userOtp.val('');
                        }
                    }).fail(function(jqXHR, textResponse, errorThrown) {
                        otpAction.hide();
                        resendOtp.addClass('CT-otp-display-none');
                        otpExpireMessage.addClass('CT-otp-display-none');
                        otpTimerMessage.addClass('CT-otp-display-none');
                        validateError
                            .removeClass('display-none')
                            .html("<span>" + jqXHR.responseText + "</span>");
                    }).always(function() {
                        otpLoader.loader('hide');
                        modalPopup.modal('openModal');
                    });
                }
                
                
            }

            function supplierRegister() {
                showLoader();
                $.ajax({
                    url: config.registrationUrl,
                    type: 'POST',
                    data: $('#CT-supplier-create-form').serialize(),
                    dataType: 'json',
                    success: function (data) {
                        if (data.error) {
                            hideLoader();
                            alertBox({
                                title: "Warning",
                                content: "<div class='CT-mprma-warning-content'>"+data.msg+"</div>",
                                actions: {
                                    always: function () {
                                        if (data.reload) {
                                            location.reload(true);
                                        }
                                    }
                                }
                            });
                        } else {
                            $(".CT-signup-step-panel").removeClass("CT-display-none");
                            $(".CT-signup-step-panel").addClass("CT-display-none");
                            $(".CT-signup-step-final").removeClass("CT-display-none");
                            $(".CT-signup-step-tab").addClass("CT-active-tab");
                            hideLoader();
                        }
                    },
                    error: function(err) {
                        alert({
                            content: err.message
                        })
                    }
                });
            }

            function showLoader() {
                $(".CT-loading-mask").removeClass("CT-display-none");
            }
    
            function hideLoader() {
                $(".CT-loading-mask").addClass("CT-display-none");
            }

            /**
             * Function to validate the Otp entered by the user
             */
            function validateOtp() {
                // Check if maximum incorrect attempts have been reached

                if (incorrectOtpCount >= maxIncorrectAttempts) {
                    validateError
                        .removeClass('display-none')
                        .html("<span>" + "You have entered incorrect OTP more than 3 times. Please try again later." + "</span>");
                    userOtp.prop('disabled', true); // Disable the input box
                    submitOtp.prop('disabled', true); // Disable the submit button
                    enableModalButtons(false);
                    otpLoader.loader('hide');
                    return false;

                }
                if(config.sendOtpVia == "mobile") {
                    const code = userOtp.val();
                    var newDate = new Date();
                    var expirytime = window.otpcreatetime + config.optExpireTimeInMilliSec;
                    var currenttime = newDate.getTime();
                    if(currenttime >= expirytime) {
                        validateError
                            .removeClass('display-none')
                            .html("<span>" + 'OTP expired. Please resend OTP and try again.' + "</span>");
                        otpLoader.loader('hide');
                        return false;
                    }
                    confirmationResult.confirm(code).then((result) => {
                    // User signed in successfully.
                    const user = result.user;
                    modalPopup.modal('closeModal');
                    customerRegisterForm.submit();
                    if (config.isB2BMarketplaceModuleEnable && $('.CT-firebaseotp-btn').length > 0) {
                        otpLoader.loader('hide');
                        supplierRegister();
                    }
                    // ...
                    }).catch((error) => {
                    validateError
                        .removeClass('display-none')
                        .html("<span>" + "Incorrect OTP Provide" + "</span>");
                        otpLoader.loader('hide');
                    alert({
                        title: $.mage.__('Authentication Error'),
                        content: $.mage.__('Incorrect OTP Provided')
                    });
                    // User couldn't sign in (bad verification code?)
                    // ...
                    });
                } else if(config.sendOtpVia == "email") {
                    if (ajaxValidate && ajaxValidate.readyState != 4) {
                        ajaxValidate.abort();
                    }
                    if ($('.CT-firebaseotp-btn').length > 0) {
                        var email = $('#supplier-email').val();
                    } else {
                        var email = $('#email_address').val();
                    }
                    var otp = userOtp.val(),
                        formKey = $.mage.cookies.get('form_key');
                    ajaxValidate = jQuery.ajax({
                            url: config.otpValidateAction,
                            showLoader: true,
                            data: {
                                'email': email,
                                'user_otp': otp,
                                'form_key': formKey
                            },
                            async: true,
                            type: 'POST',
                        }).done(function(result) {
                            if (result.error) {
                                validateError
                                    .removeClass('display-none')
                                    .html("<span>" + result.message + "</span>");
                                incorrectOtpCount++;
                            } else {
                                modalPopup.modal('closeModal');
                                customerRegisterForm.submit();
                                if (config.isB2BMarketplaceModuleEnable && $('.CT-firebaseotp-btn').length > 0) {
                                    otpLoader.loader('hide');
                                    supplierRegister();
                                }
                            }
                        }).fail(function(jqXHR, textResponse, errorThrown) {
                            validateError
                                .removeClass('display-none')
                                .html("<span>" + result.message + "</span>");
                            incorrectOtpCount++;
                        }).always(function() {
                            otpLoader.loader('hide');
                        })
                }
            }
        }
    }
);

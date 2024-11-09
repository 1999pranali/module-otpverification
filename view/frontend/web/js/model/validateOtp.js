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
        'ko',
        'jquery',
        'mage/url',
        'mage/validation',
        'Coditron_OTPVerification/js/verifyOtp',
        'mage/translate',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/checkout-data',
        'domReady!',
    ],
    function(ko, $, url, validation, verifyOtp, $t, quote, checkoutdata) {
        'use strict';

        var otpValidated = ko.observable(false);
        var selectedPaymentMethod = ko.observable('');
        var otpValidateAction = url.build('FirebaseOTPLogin/index/validate');
        $(document).on('click', 'button.submit_otp', function() {
            $('.validate_error').remove();
            var userOtp = $('#user_otp_checkout').val();
            if (userOtp != "" && $.isNumeric(userOtp)) {
                $('.CT-otp-loading-mask').removeClass('CT-otp-display-none');
                validateOtp();
            } else {
                var message = window.checkoutConfig.validateNumberError;
                var codeMessage = "<span class='validate_error'>" + message + "</span>";
                $('.otp_popup').append(codeMessage);
            }
        });

        function getCustomerEmail() {
            return quote.guestEmail ? quote.guestEmail : window.checkoutConfig.quoteData.customer_email;
        }

        /**
         * Function to prevent typing alphabets and special character in otp input box
         */
        $(document).on('keydown', "#user_otp_checkout", function(e) {
            // Allow: backspace, delete, tab, escape and .
            if ($.inArray(e.keyCode, [46, 8, 9, 27, 110]) !== -1 ||
                // Allow: Ctrl+A, Command+A
                (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: home, end, left, right, down, up
                (e.keyCode >= 35 && e.keyCode <= 40)) {
                // let it happen, don't do anything
                return;
            }
            if (e.keyCode === 13) {
                $('button.submit_otp').trigger('click');
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });

        /**
         * Validate otp entered by customer
         * ajax to
         */
        function validateOtp() {
            if (ajaxValidate && ajaxValidate.readyState != 4) {
                ajaxValidate.abort();
            }
            var email = getCustomerEmail();
            var userOtp = $('#user_otp_checkout').val();
            var formKey = $('input[name="form_key"]').val();
            var ajaxValidate = jQuery.ajax({
                url: otpValidateAction,
                data: {
                    'email': email,
                    'user_otp': userOtp,
                    'form_key': formKey
                },
                async: true,
                type: 'POST',
            }).done(function(result) {
                if (result.error) {
                    $('.validate_error').remove();
                    $('.CT-otp-loading-mask').addClass('CT-otp-display-none');
                    var errorMessage = "<div class='validate_error'><span>" + result.message + "</span></div>";
                    $('.otp_popup').append(errorMessage);
                } else {
                    $('.CT-otp-loading-mask').addClass('CT-otp-display-none');
                    window.otpValidationCompleted = true;
                    otpValidated(true);
                    setTimeout(function() {
                        $('.payment-method._active .primary.action.checkout').trigger('click');
                    }, 1000);
                    $('.payment-method-content').css("display", "block");
                    if ($('#paymet_enbled').val()) {
                        $('#otp_modal').modal('closeModal');
                        $(".otp-button").css("display", "none");
                    }
                    $('#paypalotp').hide();
                    $('#paypal-express-in-context-button').css({
                        'opacity': '1',
                        'pointer-events': 'all'
                    });
                }
            }).fail(function(jqXHR) {
                $('.CT-otp-loading-mask').addClass('CT-otp-display-none');
                $('.otp_response').addClass('error').html(jqXHR.responseText);
            });
        }

        $(document).on('click', '#co-payment-form .action.primary.checkout', function(e) {
            selectedPaymentMethod($('.payment-method._active .radio').attr('id'));
        });

        return {
            /**
             * Validate checkout agreements
             * @returns {Boolean}
             */
            validate: function() {
                if (window.checkoutConfig.is_module_enabled == 1 && window.checkoutConfig.opt_validation_enabled == 1) {
                    if (!otpValidated()) {
                        if ($.inArray($('.payment-method._active .radio').attr('id'), window.checkoutConfig.allowed_payment_methods.split(',')) == -1) {
                            return true;
                        } else if (checkoutdata.getSelectedPaymentMethod() == 'paypal_express') {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        };
    }
);
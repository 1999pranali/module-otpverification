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
        'ko',
        'jquery',
        'mage/translate',
        'Magento_Checkout/js/model/quote',
        'Magento_Ui/js/modal/alert',
    ],
    function(ko, $, $t, quote, alert) {
        'use strict';
        return function(options) {
            var ajaxRequest;
            var ajaxValidate;
            var isValidationFinished = ko.observable(false);
            var modalPopup = $("#otp_modal").modal({
                buttons: [{
                    text: options.resendText,
                    class: 'otp_resend'                    
                }],
                modalClass: 'otp_modal_popup',
                clickableOverlay: false,
                type: 'popup',
                title: options.modalTitle,
            });

            $(document).on('click', '#co-payment-form .action.primary.checkout', function(e) {
                var selectedPaymentMethod = jQuery('.payment-method._active .radio').attr('id');
                if ($('#co-payment-form').length &&
                    !window.otpValidationCompleted &&
                    $.inArray(selectedPaymentMethod, window.checkoutConfig.allowed_payment_methods.split(',')) !== -1) {
                    $('.otp_response').removeClass('success');
                    $('.otp_response').removeClass('error');
                    $('.CT-otp-loading-mask').removeClass('CT-otp-display-none');
                    sendOtpAjax();
                }
            });

            if (window.checkoutConfig.is_onestepcheckout_enabled == "1") {
                $(document).on('click', function(e) {
                    var clas = e.target.getAttribute("class");
                    var dataBind = e.target.getAttribute("data-bind");
                    var coFormId = e.target.getAttribute("id");
                    if (clas == "action primary checkout" || clas == "primary" || dataBind == "i18n: 'Place Order'" || coFormId == "co-payment-form") {
                        var selectedPaymentMethod = jQuery('.payment-method._active .radio').attr('id');
                        if ($('#co-payment-form').valid() &&
                            !window.otpValidationCompleted &&
                            $.inArray(selectedPaymentMethod, window.checkoutConfig.allowed_payment_methods.split(',')) !== -1) {
                            $('.otp_response').removeClass('success');
                            $('.otp_response').removeClass('error');
                            $('.CT-otp-loading-mask').removeClass('CT-otp-display-none');
                            sendOtpAjax();
                        }
                    }
                });
            }

            $(document).on('click', '#paypalotp', function(e) {
                var selectedPaymentMethod = jQuery('.payment-method._active .radio').attr('id');
                if ($('#co-payment-form').valid() &&
                    !window.otpValidationCompleted &&
                    $.inArray(selectedPaymentMethod, window.checkoutConfig.allowed_payment_methods.split(',')) !== -1) {
                    $('.otp_response').removeClass('success');
                    $('.otp_response').removeClass('error');
                    $('.CT-otp-loading-mask').removeClass('CT-otp-display-none');
                    sendOtpAjax();
                }
            });

            $('button.otp_resend').on('click', function(e) {
                if ($('#co-payment-form').valid()) {
                    $('.otp_response').removeClass('error');
                    $('.otp_response').removeClass('success');
                    $('.CT-otp-loading-mask').removeClass('CT-otp-display-none');
                    e.preventDefault();
                    sendOtpAjax(1);
                }
            });

            /**
             * function to get customer email on checkout page.
             * return string
             */
            function getCustomerEmail() {
                return quote.guestEmail ? quote.guestEmail : window.checkoutConfig.quoteData.customer_email;
            }

            /**
             * function to get customer mobile on checkout page.
             * return string
             */
            function getCustomerMobile() {
                return quote.billingAddress().telephone;
            }

            /**
             * function to get customer region on checkout page.
             * return string
             */
            function getCustomerRegion() {
                return quote.billingAddress().countryId;
            }

            /**
             *  function to send Otp via ajax
             */
            function sendOtpAjax(resendFlag = 0) {
                if (ajaxRequest && ajaxRequest.readyState != 4) {
                    ajaxRequest.abort();
                }
                var email = getCustomerEmail();
                var name = quote.billingAddress().firstname;
                var mobile = '';
                var region = '';
                if ($('#config').val() == '1') {
                    mobile = getCustomerMobile();
                    region = getCustomerRegion();
                }
                var formKey = $('input[name="form_key"]').val();
                var ajaxRequest = $.ajax({
                    url: options.otpAction,
                    data: {
                        'email': email,
                        'checkout': true,
                        'resend': resendFlag,
                        'form_key': formKey,
                        'mobile': mobile,
                        'region': region,
                        'name': name
                    },
                    showLoader: true,
                    async: true,
                    type: 'POST',
                }).done(function(result) {
                    if (result.error) {
                        $('.validate_error').remove();
                        $('.otp_expire_message').addClass('CT-otp-display-none');
                        $('.otp_action').hide();
                        $('.CT-otp-loading-mask').addClass('CT-otp-display-none');
                        var errorMessage = "<div class='validate_error'><span>" + result.message + "</span></div>";
                        $('.otp_popup').append(errorMessage);
                        $('button.otp_resend').addClass('CT-otp-display-none');
                    } else {
                        $('.validate_error').remove();
                        $('#otp_modal').removeClass('hide');
                        $('.otp_expire_message').removeClass('CT-otp-display-none');
                        $('.otp_action').show();
                        $('.CT-otp-loading-mask').addClass('CT-otp-display-none');
                        $('button.otp_resend').removeClass('CT-otp-display-none');
                        $('.otp_response')
                            .addClass('success')
                            .html(result.message);
                        $('#user_otp_checkout').val('');
                    }
                }).fail(function(jqXHR) {
                    $('.otp_expire_message')
                        .addClass('CT-otp-display-none');
                    $('.otp_action').hide();
                    $('.CT-otp-loading-mask')
                        .addClass('CT-otp-display-none');
                    $('.otp_response')
                        .addClass('error')
                        .html(jqXHR.responseText);
                    $('button.otp_resend')
                        .addClass('CT-otp-display-none');
                }).always(function() {
                    modalPopup.modal('openModal');
                });
            }
        }
    }
);
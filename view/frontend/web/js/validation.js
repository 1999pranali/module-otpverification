/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

require([
    'jquery',
    'jquery/validate',
    'mage/translate',
], function ($) {
    'use strict';
    var rules = {
        "CT-otp-telephone": [
            function (v) {
                return $.mage.isEmptyNoTrim(v) || /^\+\d{9,}$/.test(v);
            },
            $.mage.__('Please enter a valid phone number (Ex: +918888888888).')
        ],
        'CT-otp-email-telephone': [
            function (v) {
                return $.mage.isEmptyNoTrim(v) || /^([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9,!\#\$%&'\*\+\/=\?\^_`\{\|\}~-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*@([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z0-9-]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*\.(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]){2,})$/i.test(v) || /^\+\d{9,}$/.test(v); //eslint-disable-line max-len
            },
            $.mage.__('Please enter a valid phone number (Ex: +918888888888) or email address (Ex: johndoe@domain.com).')
        ],
    };
    $.each(rules, function (i, rule) {
        rule.unshift(i);
        $.validator.addMethod.apply($.validator, rule);
    });
});

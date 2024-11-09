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
    'Coditron_OTPVerification/js/action/post',
    'mage/cookies',
], function ($, sendPost) {
    'use strict';

    return {
        requestUrl: 'otplogin/customer/loginconfig',
        
        /**
         * Get Otp Login Component Config
         * @returns {$.Deffered}
         */
        getConfig: function () {
            return sendPost(
                {'form_key': $.mage.cookies.get('form_key')},
                this.requestUrl,
                false
            );
        }
    };
});

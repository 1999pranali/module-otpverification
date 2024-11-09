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
    'mage/storage',
    'mage/translate'
], function ($, storage, $t) {
    'use strict';

        /**
         * @param {Object} request
         * @param {String} requestUrl
         * @param {*} isGlobal
         * @returns $.Deffered
         */
    var action = function (request, requestUrl, isGlobal) {
            return storage.post(
                requestUrl,
                JSON.stringify(request),
                isGlobal
            );
        };

    return action;
});

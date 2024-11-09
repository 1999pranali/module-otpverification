/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

define([
    'ko',
    'underscore',
    'mage/apply/main'
], function (ko, _, mage) {
    'use strict';

    ko.bindingHandlers.mageInitUpdate = {
        /**
         * Initializes components assigned to HTML elements.
         *
         * @param {HTMLElement} el
         * @param {Function} valueAccessor
         */
        init: function (el, valueAccessor) {
            var data = valueAccessor();

            _.each(data, function (config, component) {
                mage.applyFor(el, config, component);
            });
        },

        /**
         * Updates components assigned to HTML elements.
         *
         * @param {HTMLElement} el
         * @param {Function} valueAccessor
         */
        update: function (el, valueAccessor) {
            var data = valueAccessor();
            data = ko.unwrap(data);
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            _.each(data, function (config, component) {
                mage.applyFor(el, config, component);
            });
        }
    };
});
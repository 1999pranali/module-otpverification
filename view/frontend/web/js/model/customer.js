/**
 * Coditron
 *
 * @category  Coditron
 * @package   Coditron_OTPVerification
 * @author    Coditron
 * @copyright Copyright (c) Coditron (https://coditron.com)
 */

define([
    'jquery'
], function($) {
        'use strict';
        var customer = {
            
            /**
             * Customer Data object
             */
            customerData: {},

            /**
             * Initialize customerData object
             */
            initializeCustomerData: function() {
                try {
                    this.customerData = localStorage.getItem('CTCustomerData') ?
                        JSON.parse(localStorage.getItem('CTCustomerData')) : {};
                } catch (error) {
                    this.customerData = {};
                }
            },

            /**
             * Get Customer Data
             * @returns {object}
             */
            getCustomerData: function() {
                return this.customerData;
            },

            /**
             * Get Customer Firstname
             * @return {string}
             */
            getCustomerFirstname: function() {
                if (this.customerData.hasOwnProperty('firstname')) {
                    return this.customerData.firstname;
                }
                return '';
            },

            /**
             * Get Customer Email
             * @return {string}
             */
            getCustomerEmail: function() {
                if (this.customerData.hasOwnProperty('email')) {
                    return this.customerData.email;
                }

                return '';
            },

            /**
             * Get customer telephone number
             * @return {string}
             */
            getCustomerTelephoneFromAddress: function() {
                var telephone;
                if (this.customerData.hasOwnProperty('addresses')) {
                    var defaultBillingId = this.customerData.default_billing;
                    var defaultBilling = this.customerData.addresses[defaultBillingId];
                    telephone = defaultBilling &&
                        defaultBilling.hasOwnProperty('telephone') &&
                        defaultBilling.hasOwnProperty('country_id') ? defaultBilling.telephone : null;
                    if (!telephone) {
                        var defaultShippingId = this.customerData.default_shipping;
                        var defaultShipping = this.customerData.addresses[defaultShippingId];
                        telephone = defaultShipping &&
                            defaultShipping.hasOwnProperty('telephone') &&
                            defaultShipping.hasOwnProperty('country_id') ?
                            defaultShipping.telephone :
                            null;
                    }
                    if (!telephone) {
                        for (var addressId in this.customerData.addresses) {
                            var address = addresses[addressId];
                            telephone = address.hasOwnProperty('telephone') ? address.telephone : null;
                            country_id = address.hasOwnProperty('country_id') ? address.country_id : null;

                            if (telephone && country_id) {
                                break;
                            }
                        }
                    }
                }

                return telephone ? telephone : "";
            },

            /**
             * Get customer country id
             * @return {int|null}
             */
            getCustomerCountryIdFromAddress: function() {
                var country_id;
                if (this.customerData.hasOwnProperty('addresses')) {
                    var defaultBillingId = this.customerData.default_billing;
                    var defaultBilling = this.customerData.addresses[defaultBillingId];
                    country_id = defaultBilling &&
                        defaultBilling.hasOwnProperty('telephone') &&
                        defaultBilling.hasOwnProperty('country_id') ?
                        defaultBilling.country_id :
                        null;
                    if (!country_id) {
                        var defaultShippingId = this.customerData.default_shipping;
                        var defaultShipping = this.customerData.addresses[defaultShippingId];
                        country_id = defaultShipping &&
                            defaultShipping.hasOwnProperty('telephone') &&
                            defaultShipping.hasOwnProperty('country_id') ?
                            defaultShipping.country_id :
                            null;
                    }
                    if (!country_id) {
                        for (var addressId in this.customerData.addresses) {
                            var address = addresses[addressId];
                            telephone = address.hasOwnProperty('telephone') ? address.telephone : null;
                            country_id = address.hasOwnProperty('country_id') ? address.country_id : null;

                            if (telephone && country_id) {
                                break;
                            }
                        }
                    }
                }

                return country_id ? country_id : null;
            },

            /**
             * Set CustomerData
             * @param {object}
             * @returns {this}
             */
            setCustomerData: function(customerData) {
                this.customerData = customerData;

                return this;
            }
        };

        customer.initializeCustomerData();

        return customer;
    }
);
if (typeof shopgoSns == 'undefined') {
    var shopgoSns = new Object();
}

shopgoSns.addressesDetails = Array();

shopgoSns.formSelectors = {
    form: '#sns-form',
    email: '#sns-email',
    password: '#sns-password',
    ajaxLoader: '#sns-get-addresses-loader',
    addressesContainer: '#sns-addresses-container',
    addressesList: '#sns-addresses-list',
    addressLabelContainer: '.sns-address-label-container',
    addressLabel: '.sns-address-label',
    addressDetails: '.sns-address-details',
    addressSelected: '.sns-address-selected',
    addressUse: '.sns-address-use',
    showHide: '.showhide a'
};

shopgoSns.addressFormSelectors = {
    firstname: '#firstname',
    lastname: '#lastname',
    telephone: '#telephone',
    street1: '#street_1',
    street2: '#street_2',
    country: '#country',
    city: '#city',
    regionId: '#region_id',
    region: '#region',
    zip: '#zip'
};

(function($) {
    $(document).ready(function() {
        sns.initTranslations();
        sns.getAddresses();

        $(document).on('click', shopgoSns.formSelectors.addressUse, function(e) {
            e.preventDefault();
            sns.importAddress($(this).attr('rel'));
        });

        $(document).on('click', shopgoSns.formSelectors.addressLabel, function(e) {
            e.preventDefault();

            var addressSelected =
                shopgoSns.formSelectors.addressSelected.replace('.', '');

            $(shopgoSns.formSelectors.addressDetails).removeClass(
                addressSelected
            );
            $('#' + $(this).attr('for')).addClass(
                addressSelected
            );
        });

        $(document).on(
            'click',
            shopgoSns.formSelectors.addressesContainer
            + ' ' + shopgoSns.formSelectors.showHide,
            function(e) {
                e.preventDefault();
                sns.showHideList();
            }
        );
    });

    var sns = {
        getAddresses: function() {
            $(shopgoSns.formSelectors.form).ajaxForm({
                dataType: 'json',
                beforeSubmit: function(formData, jqForm, options) {
                    shopgoSns.addressesDetails = Array();

                    $(shopgoSns.formSelectors.ajaxLoader).show();
                    $(shopgoSns.formSelectors.addressesContainer).hide();

                    if ($('#sns-email').val() == ''
                        || $('#sns-password').val() == '') {
                        $(shopgoSns.formSelectors.ajaxLoader).hide();
                    }

                    return true;
                },
                success: function(responseText, statusText, xhr, $form) {
                    $(shopgoSns.formSelectors.ajaxLoader).hide();

                    if (responseText.status) {
                        shopgoSns.addressesDetails = responseText.data;

                        if ($.isEmptyObject(shopgoSns.addressesDetails.RegistrationGUID)) {
                            alert(shopgoSns.userMessages.badResponse);
                            return false;
                        }

                        sns.createAddressesList();
                        $(shopgoSns.formSelectors.addressesContainer).show();
                    } else {
                        alert(responseText.message);
                    }
                },
                error: function(responseText) {
                    $(shopgoSns.formSelectors.ajaxLoader).hide();
                    alert(shopgoSns.userMessages.badAuth);
                }
            });
        },
        importAddress: function(country) {
            if (shopgoSns.addressesDetails.length == 0) {
                return false;
            }

            var address = null;

            $.each(shopgoSns.addressesDetails.MailboxDetails.Mailbox, function(key, value) {
                if (value.MailboxLocation == country.toUpperCase()) {
                    address = value;
                    return;
                }
            });

            var formSelectors = shopgoSns.addressFormSelectors;
            var accountNo = '';

            if ($(formSelectors.firstname).length) {
                $(formSelectors.firstname).val(
                    shopgoSns.addressesDetails.CustomerFirstName
                );
            }
            if ($(formSelectors.street2).length) {
                $(formSelectors.street2).val(
                    address.MailboxNumber
                );
            } else {
                accountNo = ' / ' + address.MailboxNumber;
            }
            if ($(formSelectors.lastname).length) {
                $(formSelectors.lastname).val(
                    shopgoSns.addressesDetails.CustomerLastName + accountNo
                );
            }
            if ($(formSelectors.telephone).length) {
                $(formSelectors.telephone).val(
                    address.MailboxPhone
                );
            }
            if ($(formSelectors.street1).length) {
                $(formSelectors.street1).val(
                    address.MailboxAddress1
                );
            }

            if ($(formSelectors.country).length) {
                $(formSelectors.country).val(
                    // Handle differences between Magento and SnS.
                    address.MailboxLocation == 'UK'
                        ? 'GB'
                        : address.MailboxLocation.toUpperCase()
                );
            }

            _regionUpdater.update();

            if ($(formSelectors.city).length) {
                $(formSelectors.city).val(
                    address.MailboxCity
                );
            }

            if ($(formSelectors.regionId).length || $(formSelectors.region).length) {
                if ($(formSelectors.regionId).is(':visible')) {
                    $(formSelectors.regionId).val(
                        sns.getRegionId(address.MailboxState, address.MailboxLocation)
                    );
                } else {
                    $(formSelectors.region).val(
                        !$.isEmptyObject(address.MailboxState)
                            ? address.MailboxState : ''
                    );
                }
            }

            if ($(formSelectors.zip).length) {
                $(formSelectors.zip).val(
                    !$.isEmptyObject(address.MailboxZipCode)
                        ? address.MailboxZipCode : ''
                );
            }

            alert(shopgoSns.userMessages.addressImport);

            return true;
        },
        getRegionId: function(region, country) {
            var id = 0;

            country = country.toUpperCase();

            if (!$.isEmptyObject(region)) {
                region = region.toUpperCase();
            }

            $.each(shopgoSns.addressesRegions[country], function (key, value) {
                // Some countries should be handled manually,
                // because of some differences between Magento and SnS.
                var validCases = [
                    country == 'DE'
                        && value.code == shopgoSns.missingAddressRegions.de.code,
                    country == 'CA'
                        && value.code == shopgoSns.missingAddressRegions.ca.code,
                    country == 'FR'
                        && value.code == shopgoSns.missingAddressRegions.fr.code,
                    country == 'ES'
                        && value.code == shopgoSns.missingAddressRegions.es.code,
                    value.code == region
                ];

                for (i = 0; i < validCases.length; i++) {
                    if (validCases[i]) {
                        id = value.region_id;
                        break;
                    }
                }
            });

            return id;
        },
        // It's damn expensive, but still clean and produces less errors.
        buildAddressLabel: function(data) {
            // Details Label Separator.
            var dls = ':\u00a0';
            // Details Content elements.
            var detailsContentElms = ['label', 'span'];
            // Define all address label/block elements.
            var label = {
                rootLi: document.createElement('li'),
                labelDiv: document.createElement('div'),
                detailsDiv: document.createElement('div'),
                countryLink: document.createElement('a'),
                countryLinkText: document.createTextNode(data.countryLinkText),
                useLink: document.createElement('a'),
                useLinkText: document.createTextNode(Translator.translate('Use')),
                detailsUl: document.createElement('ul'),
                detailsContent: {
                    accountNo: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Account No.') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.accountNo)
                    },
                    name: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Full Name') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.name)
                    },
                    address1: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Address 1') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.address1)
                    },
                    address2: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Address 2') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.address2)
                    },
                    city: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('City') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.city)
                    },
                    state: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('State') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.state)
                    },
                    zip: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Zip/Postal Code') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.zip)
                    },
                    telephone: {
                        li: document.createElement('li'),
                        label: document.createElement('label'),
                        labelText: document.createTextNode(Translator.translate('Telephone') + dls),
                        span: document.createElement('span'),
                        spanText: document.createTextNode(data.telephone)
                    }
                }
            };


            // Set Label Div attributes.
            label.labelDiv
                .setAttribute('class', shopgoSns.formSelectors.addressLabelContainer.replace('.', ''));

            // Set Details Div attributes.
            label.detailsDiv
                .setAttribute('id', 'sns-' + data.countryCode.toLowerCase() + '-address');
            label.detailsDiv
                .setAttribute('class', shopgoSns.formSelectors.addressDetails.replace('.', ''));

            // Set Country Link attributes and append text to it.
            label.countryLink
                .setAttribute('href', '#sns-' + data.countryCode.toLowerCase() + '-address');
            label.countryLink
                .setAttribute('class', shopgoSns.formSelectors.addressLabel.replace('.', ''));
            label.countryLink
                .setAttribute('for', 'sns-' + data.countryCode.toLowerCase() + '-address');
            label.countryLink
                .appendChild(label.countryLinkText);

            // Set Use Link attributes and append text to it.
            label.useLink
                .setAttribute('href', '#');
            label.useLink
                .setAttribute('class', shopgoSns.formSelectors.addressUse.replace('.', ''));
            label.useLink
                .setAttribute('rel', data.countryCode.toUpperCase());
            label.useLink
                .appendChild(label.useLinkText);

            // Append Country Link and Use Link to Label Div.
            label.labelDiv
                .appendChild(label.countryLink);
            label.labelDiv
                .appendChild(label.useLink);

            // For Account No., Name, Address 1, Address 2, City, Zip and Telephone elements,
            // append texts to their label and span elements,
            // then append those elements to their containing elements,
            // and finally append those containers to Details Ul.
            $.each(label.detailsContent, function(i, j) {
                for (y = 0; y < detailsContentElms.length; y++) {
                    j[detailsContentElms[y]]
                        .appendChild(j[detailsContentElms[y] + "Text"]);
                    j.li
                        .appendChild(j[detailsContentElms[y]]);
                }

                label.detailsUl.appendChild(j.li);
            });

            // Append Details Ul to Details Div.
            label.detailsDiv
                .appendChild(label.detailsUl);

            // Append Label Div and Details Div to Root Li.
            label.rootLi
                .appendChild(label.labelDiv);
            label.rootLi
                .appendChild(label.detailsDiv);

            return label.rootLi;
        },
        createAddressesList: function() {
            var data = null;
            var html = document.createElement('ul');
            var addresses =
                shopgoSns.addressesDetails.MailboxDetails.Mailbox;

            $.each(addresses, function(i, j) {
                data = {
                    countryLinkText: j.MailboxCountry,
                    accountNo: j.MailboxNumber,
                    name: j.MailboxFullName,
                    address1: j.MailboxAddress1,
                    address2: j.MailboxNumber,
                    city: j.MailboxCity,
                    state:
                        !$.isEmptyObject(j.MailboxState)
                        ? j.MailboxState : '-',
                    zip:
                        !$.isEmptyObject(j.MailboxZipCode)
                        ? j.MailboxZipCode : '-',
                    telephone: j.MailboxPhone,
                    countryCode: j.MailboxLocation
                };

                html.appendChild(sns.buildAddressLabel(data));
            });

            $(shopgoSns.formSelectors.addressesList).html(html);
        },
        showHideList: function() {
            var list = shopgoSns.formSelectors.addressesList;
            var showHideSelector =
                shopgoSns.formSelectors.addressesContainer
                + ' ' +
                shopgoSns.formSelectors.showHide;

            $(shopgoSns.formSelectors.addressesList).toggle();

            if ($(list).is(":visible")) {
                $(showHideSelector).html(shopgoSns.showHideTexts.hide);
            } else {
                $(showHideSelector).html(shopgoSns.showHideTexts.show);
            }
        },
        initTranslations: function() {
            shopgoSns.userMessages = {
                badAuth:
                    Translator.translate("Could not authenticate user")
                    + "\n" +
                    Translator.translate("If the issue persists, please contact the website administrator"),
                badResponse:
                    Translator.translate("Could not retrieve Shop and Ship addresses list")
                    + "\n" +
                    Translator.translate("If the issue persists, please contact the website administrator"),
                addressImport:
                    Translator.translate("The selected address has been set")
                    + "\n" +
                    Translator.translate("Check your account details then save")
            };

            shopgoSns.showHideTexts = {
                hide: Translator.translate("hide"),
                show: Translator.translate("show")
            };
        }
    };
})(jQuery);

var shopgoSns = {
    addressesDetails: Array()
};

(function($) {
    $(document).ready(function() {
        sns.getAddresses();

        $(document).on('click', '.sns-address-flag', function(e) {
            e.preventDefault();
            sns.importAddress($(this).attr('rel'));
        });
    });

    var sns = {
        getAddresses: function() {
            $('#sns-auth-form-validate').ajaxForm({
                dataType: 'json',
                beforeSubmit: function(formData, jqForm, options) {
                    shopgoSns.addressesDetails = Array();

                    $('#sns-get-addresses-loader').show();
                    $('#sns-addresses-container').hide();

                    var valid =
                        $('#sns-email').val() != ''
                        && $('#sns-password').val() != '';

                    if (!valid) {
                        $('#sns-get-addresses-loader').hide();
                        alert(Translator.translate('You should fill Shop and Ship email and password in order to process your request'));
                    }

                    return valid;
                },
                success: function(responseText, statusText, xhr, $form) {
                    $('#sns-get-addresses-loader').hide();

                    if (responseText.status) {
                        shopgoSns.addressesDetails = responseText.data;
                        $('#sns-addresses-container').show();
                    } else {
                        alert(responseText.message);
                    }
                },
                error: function(responseText) {
                    $('#sns-get-addresses-loader').hide();
                    alert(Translator.translate('Could not authenticate user'));
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

            $('#firstname').val(shopgoSns.addressesDetails.CustomerFirstName);
            $('#lastname').val(shopgoSns.addressesDetails.CustomerLastName);
            $('#telephone').val(address.MailboxPhone);
            $('#street_1').val(address.MailboxAddress1);
            $('#street_2').val(address.MailboxNumber);

            $('#country').val(
                address.MailboxLocation == 'UK'
                    ? 'GB'
                    : address.MailboxLocation.toUpperCase()
            );

            _regionUpdater.update();

            $('#city').val(address.MailboxCity);

            if ($('#region_id').is(':visible')) {
                $('#region_id').val(sns.getRegionId(address.MailboxState, address.MailboxLocation));
            } else {
                $('#region').val(
                    !$.isEmptyObject(address.MailboxState)
                        ? address.MailboxState : ''
                );
            }

            $('#zip').val(
                !$.isEmptyObject(address.MailboxZipCode)
                    ? address.MailboxZipCode : ''
            );

            alert(Translator.translate('The selected address has been set\nYou can save now'));

            return true;
        },
        getRegionId: function(region, country) {
            var id = 0;

            country = country.toUpperCase();

            if (!$.isEmptyObject(region)) {
                region = region.toUpperCase();
            }

            $.each(shopgoSns.addressesRegions[country], function (key, value) {
                if (country == 'DE'
                    && value.code == shopgoSns.deAddressRegion.code) {
                    id = value.region_id;
                    return;
                } else if (value.code == region) {
                    id = value.region_id;
                    return;
                }
            });

            return id;
        }
    };
})(jQuery);

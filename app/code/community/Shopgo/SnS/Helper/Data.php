<?php

class Shopgo_SnS_Helper_Data extends Mage_Core_Helper_Abstract
{
    public function restRequest($method, $params)
    {
        $result = null;
        $url = $this->_getRestUrl($method);

        $ch = curl_init();

        $data = $this->_restDataFormat($method, $params);

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml; charset=UTF-8'));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $result = curl_exec($ch);

        curl_close($ch);

        return $result;
    }

    private function _restDataFormat($method, $params)
    {
        $data = '';

        switch ($method) {
            case 'authenticate_user':
                $data =
                    "<SNSAuthenticateUserRequest>
                        <Email>{$params['sns-email']}</Email>
                        <Password>{$params['sns-password']}</Password>
                    </SNSAuthenticateUserRequest>";
                break;
            case 'get_address_list':
                $data =
                    "<SNSMailboxesRequest>
                        <RegistrationGUID>{$params['registeration-guid']}</RegistrationGUID>
                    </SNSMailboxesRequest>";
                break;
        }

        return $data;
    }

    private function _getRestUrl($method)
    {
        $url = '';

        switch ($method) {
            case 'authenticate_user':
                $url = 'https://ws.aramex.net/ClientApps/ShopandShip/Service_1_0.svc/authenticateuser';
                break;
            case 'get_address_list':
                $url = 'https://ws.aramex.net/ClientApps/ShopandShip/Service_1_0.svc/getusermailboxes';
                break;
        }

        return $url;
    }

    public function getAddressesRegions($json = false)
    {
        $regions = array();

        $regionCollection = Mage::getModel('directory/region')->getResourceCollection()
            ->addCountryFilter(array('US', 'DE'))
            ->load();

        foreach ($regionCollection as $region) {
            $regions[$region->getCountryId()][] = array(
                'region_id' => $region->getRegionId(),
                'code'      => $region->getCode(),
                'name'      => $region->getName()
            );
        }

        return $json ? json_encode($regions) : $regions;
    }
}

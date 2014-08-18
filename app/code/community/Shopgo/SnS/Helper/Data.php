<?php

class Shopgo_SnS_Helper_Data extends Mage_Core_Helper_Abstract
{
    public function restRequest($method, $params)
    {
        $result     = null;
        $url        = $this->_getRestUrl($method);
        $data       = $this->_restDataFormat($method, $params);
        $httpClient = new Varien_Http_Client();

        $result = $httpClient
            ->setUri($url)
            ->setHeaders('Content-Type: text/xml; charset=UTF-8')
            ->setRawData($data)
            ->request(Varien_Http_Client::POST)
            ->getBody();

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
        $url   = 'https://ws.aramex.net/ClientApps/ShopandShip/Service_1_0.svc/';
        $param = '';

        switch ($method) {
            case 'authenticate_user':
                $param = 'authenticateuser';
                break;
            case 'get_address_list':
                $param = 'getusermailboxes';
                break;
        }

        return $url . $param;
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

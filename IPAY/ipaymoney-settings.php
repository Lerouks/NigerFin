<?php

/**
 * Settings for iPaymoney Plugin.
 *
 */
defined('ABSPATH') || exit;

return array(
    'enabled' => array(
        'title' => __('Enable/Disable', 'ipaymoney-woocommerce'),
        'label' => __('Enable iPaymoney Gateway', 'ipaymoney-woocommerce'),
        'type' => 'checkbox',
        'description' => '',
        'default' => 'yes'
    ),

    'testmode' => array(
        'title' => __('Test Mode', 'ipaymoney-woocommerce'),
        'label' => __('Enable Test Mode', 'ipaymoney-woocommerce'),
        'type' => 'checkbox',
        'description' => __('Sets iPaymoney into test mode', 'ipaymoney-woocommerce'),
        'default' => 'no',
        'desc_tip'    => true,
    ),
    'title' => array(
        'title'       => __( '(Optional) Title', 'ipaymoney-woocommerce' ),
        'type'        => 'text',
        'description' => __( 'This controls the title which the user sees during checkout.', 'ipaymoney-woocommerce' ),
        'default'     => __( 'Pay by Mobile Money and Credit Card (iPaymoney)', 'ipaymoney-woocommerce' ),
        'desc_tip'    => true,
    ),
    'description' => array(
        'title'       => __( '(Optional) Description', 'ipaymoney-woocommerce' ),
        'type'        => 'text',
        'description' => __( 'This controls the description which the user sees during checkout.', 'ipaymoney-woocommerce' ),
        'default'     => __( 'Use ipaymoney to pay with your Mobile Money account, credit card or bank account', 'ipaymoney-woocommerce' ),
        'desc_tip'    => true,
    ),
    'public_key' => array(
        'title' => __('Public KEY', 'ipaymoney-woocommerce'),
        'type' => 'password',
        'desc_tip'    => true,
        'description' => __('Get your API keys from your Kipaymoney dashboard', 'ipaymoney-woocommerce')
    ),
    'private_key' => array(
        'title' => __('Private KEY', 'kkiapay-woocommerce'),
        'type' => 'password',
        'desc_tip'    => true,
        'description' => __('Get your API keys from your Kkkiapay dashboard', 'kkiapay-woocommerce')
    )
);

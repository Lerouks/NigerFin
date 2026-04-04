<?php
/**
 * Plugin Name: iPaymoney Payments Gateway
 * Plugin URI: https://wordpress.org/plugins/ipaymoney-woocommerce-plugin
 * Description: iPaymoney allows businesses to safely receive payments by mobile money, credit card and bank account.
 * Author: Ipaymoney Developer Team ❤️
 * Author URI: https://i-pay.money/
 * License: GPLv2
 * Version: 2.0.1
 * Requires at least: 4.4
 * Tested up to: 5.7.2
 * WC requires at least: 2.6
 * WC tested up to: 5.0.0
 * Text Domain: ipaymoney-woocommerce
 * Domain Path: /languages
*/

// Make sure WooCommerce is active
 if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) return;

/*
 * The class itself, please note that it is inside plugins_loaded action hook
 */
function ipaymoney_init_gateway_class() {
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) return;
    require_once(plugin_dir_path(__FILE__) . 'includes/class-wc-ipaymoney-gateway.php');
    
    add_filter( 'woocommerce_payment_gateways', 'ipaymoney_add_gateway_class' );

    /*
    * This action hook registers our PHP class as a WooCommerce payment gateway
    */
        function ipaymoney_add_gateway_class( $gateways ) {
	        $gateways[] = 'WC_Ipaymoney_Gateway';
	    return $gateways;
        } 

}

add_action( 'plugins_loaded', 'ipaymoney_init_gateway_class' );

/**
 * Adds plugin action links.
 */
function ipaymoney_action_links( $links ) {

	$links[] = 	'<a href="admin.php?page=wc-settings&tab=checkout&section=ipaymoney_woocommerce_plugin">' . __('Settings', 'ipaymoney-woocommerce') . '</a>';
	$links[] = '<a href="https://i-pay.money/docs" target="_blank">' . __('Docs', 'ipaymoney-woocommerce') . '</a>';
	// $links[] = '<a href="http://support.i-pay.money" target="_blank">' .__('Support', 'ipaymoney-woocommerce'). '</a>';

	return $links;
}

add_action( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'ipaymoney_action_links' );

/**
 * Load tanslation files
 */
function ipaymoney_load_plugin_textdomain() {
    load_plugin_textdomain( 'ipaymoney-woocommerce', FALSE, basename( dirname( __FILE__ ) ) . '/languages/' );
}

add_action( 'plugins_loaded', 'ipaymoney_load_plugin_textdomain' );


<?php
/**
 * Plugin Name: Turning Point Homes - Leads & SEO
 * Description: Sends every Elementor form submission to the "Seller Leads" Google Sheet
 *              (which Zapier passes to REsimpli), redirects the visitor to /thank-you/,
 *              creates that page, adds LocalBusiness schema and fixes the business address.
 *
 * Install: upload to wp-content/mu-plugins/ (must-use plugins load automatically).
 * Remove:  delete the file. Nothing else on the site is changed except the /thank-you/ page it creates.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Google Apps Script web app URL (ends in /exec). Leave '' until it's deployed:
// Elementor still saves every submission under Elementor > Submissions.
const TPH_SHEET_URL = '';
const TPH_THANK_YOU_SLUG = 'thank-you';
const TPH_PHONE = ''; // e.g. '(816) 555-0123'. Shown on the thank-you page and in schema when set.
const TPH_EMAIL = 'nick@investturningpoint.com';
const TPH_ADDRESS = '25209 E Blue Mills Rd, Independence, MO 64058';
// Old address text found on the site => replaced with TPH_ADDRESS in the page output.
const TPH_OLD_ADDRESSES = [];

/* ------------------------------------------------------------------ */
/* 1. Elementor form -> Google Sheet, then redirect to the thank-you page */
/* ------------------------------------------------------------------ */

add_action( 'elementor_pro/forms/new_record', 'tph_handle_form', 10, 2 );

function tph_handle_form( $record, $ajax_handler ) {
	if ( empty( $ajax_handler->is_success ) ) {
		return; // Elementor rejected it (validation/spam): don't send or redirect.
	}

	$lead = tph_map_fields( (array) $record->get( 'fields' ) );
	$lead['sourcePage'] = isset( $_SERVER['HTTP_REFERER'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : home_url( '/' );
	tph_send_to_sheet( $lead );

	$ajax_handler->add_response_data( 'redirect_url', home_url( '/' . TPH_THANK_YOU_SLUG . '/' ) );
}

/**
 * Elementor field IDs/labels are whatever the form builder used ("name", "field_3c1a",
 * "Property Address"...), so match on both ID and label.
 */
function tph_map_fields( array $fields ) {
	$patterns = [
		'firstName'   => '/^(first.?name|fname|first)$/',
		'lastName'    => '/^(last.?name|lname|last|surname)$/',
		'fullName'    => '/^(name|full.?name|your.?name)$/',
		'phone'       => '/phone|tel|mobile|cell/',
		'email'       => '/e.?mail/',
		// Checked before address so "Property Condition" / "Property Value" don't land there.
		'timeline'    => '/timeline|how.?soon|when/',
		'condition'   => '/condition|repair/',
		'askingPrice' => '/price|asking|value/',
		'reason'      => '/reason|why|motivation/',
		'zip'         => '/zip|postal/',
		'city'        => '/^city$/',
		'state'       => '/^state$/',
		'address'     => '/address|street|property/',
	];
	$lead  = array_fill_keys( array_keys( $patterns ), '' );
	$extra = [];

	foreach ( $fields as $id => $field ) {
		$value = isset( $field['value'] ) ? trim( (string) $field['value'] ) : '';
		if ( '' === $value ) {
			continue;
		}
		$keys    = [ strtolower( (string) $id ), strtolower( (string) ( $field['title'] ?? '' ) ) ];
		$matched = false;
		// Try the field ID against every pattern first, then the label.
		foreach ( $keys as $k ) {
			foreach ( $patterns as $key => $regex ) {
				if ( '' !== $k && '' === $lead[ $key ] && preg_match( $regex, $k ) ) {
					$lead[ $key ] = $value;
					$matched      = true;
					break 2;
				}
			}
		}
		// The type is the most reliable signal for phone and email.
		$type = $field['type'] ?? '';
		if ( ! $matched && 'tel' === $type && '' === $lead['phone'] ) {
			$lead['phone'] = $value;
			$matched       = true;
		}
		if ( ! $matched && 'email' === $type && '' === $lead['email'] ) {
			$lead['email'] = $value;
			$matched       = true;
		}
		if ( ! $matched ) {
			$extra[] = ( $field['title'] ?? $id ) . ': ' . $value;
		}
	}

	// A single "Name" field becomes first + last name.
	if ( '' !== $lead['fullName'] && '' === $lead['firstName'] ) {
		$parts             = preg_split( '/\s+/', $lead['fullName'], 2 );
		$lead['firstName'] = $parts[0];
		if ( '' === $lead['lastName'] && isset( $parts[1] ) ) {
			$lead['lastName'] = $parts[1];
		}
	}
	unset( $lead['fullName'] );

	// Anything we couldn't place goes into the reason column so nothing is lost.
	if ( $extra ) {
		$lead['reason'] = trim( $lead['reason'] . ( '' !== $lead['reason'] ? ' | ' : '' ) . implode( ' | ', $extra ) );
	}
	return $lead;
}

function tph_send_to_sheet( array $lead ) {
	if ( '' === TPH_SHEET_URL ) {
		return false;
	}
	// Apps Script saves the row, then answers with a redirect; we don't need the reply.
	$response = wp_remote_post(
		TPH_SHEET_URL,
		[
			'timeout'     => 10,
			'redirection' => 0,
			'body'        => $lead,
		]
	);
	if ( is_wp_error( $response ) ) {
		error_log( 'Turning Point leads: could not reach Google Sheet: ' . $response->get_error_message() );
		return false;
	}
	return true;
}

/* ------------------------------------------------------------------ */
/* 2. Thank-you page (created once) and kept out of Google's index     */
/* ------------------------------------------------------------------ */

add_action( 'init', 'tph_ensure_thank_you_page' );

function tph_ensure_thank_you_page() {
	if ( get_option( 'tph_thank_you_page_id' ) && get_post( get_option( 'tph_thank_you_page_id' ) ) ) {
		return;
	}
	$existing = get_page_by_path( TPH_THANK_YOU_SLUG );
	$page_id  = $existing ? $existing->ID : wp_insert_post(
		[
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => 'Thank You',
			'post_name'    => TPH_THANK_YOU_SLUG,
			'post_content' => '[tph_thank_you]',
		]
	);
	if ( $page_id && ! is_wp_error( $page_id ) ) {
		update_option( 'tph_thank_you_page_id', (int) $page_id );
	}
}

add_shortcode( 'tph_thank_you', 'tph_thank_you_html' );

function tph_thank_you_html() {
	$phone_link = TPH_PHONE ? 'tel:' . preg_replace( '/[^0-9+]/', '', TPH_PHONE ) : '';
	ob_start();
	?>
	<style>
		.tph-ty{max-width:720px;margin:0 auto;padding:32px 20px;color:#1f2933;text-align:center}
		.tph-ty .tph-check{width:72px;height:72px;border-radius:50%;background:#2f855a;color:#fff;font-size:40px;line-height:72px;margin:0 auto 16px}
		.tph-ty h1{font-size:32px;margin:0 0 8px}
		.tph-ty .tph-lead{font-size:18px;color:#52606d;margin:0 0 32px}
		.tph-steps{text-align:left;display:grid;gap:16px;margin-bottom:32px}
		.tph-step{display:flex;gap:16px;padding:18px;border:1px solid #e4e7eb;border-radius:12px;background:#fff}
		.tph-num{flex:0 0 36px;height:36px;border-radius:50%;background:#e6f4ea;color:#2f855a;font-weight:700;line-height:36px;text-align:center}
		.tph-step h3{margin:0 0 4px;font-size:18px}.tph-step p{margin:0;color:#52606d}
		.tph-cta{display:inline-block;padding:14px 28px;background:#2f855a;color:#fff!important;font-weight:700;font-size:18px;border-radius:8px;text-decoration:none}
		.tph-contact{margin-top:28px;color:#52606d;font-size:15px;line-height:1.6}
	</style>
	<div class="tph-ty">
		<div class="tph-check">&#10003;</div>
		<h1>Thank you! We got your information.</h1>
		<p class="tph-lead">A member of the Turning Point Homes team will reach out shortly, usually within one business day.</p>
		<div class="tph-steps">
			<div class="tph-step"><div class="tph-num">1</div><div><h3>We review your property</h3><p>We look at your home's details and recent sales in your neighborhood.</p></div></div>
			<div class="tph-step"><div class="tph-num">2</div><div><h3>We give you a call</h3><p>We'll call or text the number you gave us for a quick, no-pressure conversation about your goals and timeline. Keep an eye out for our call.</p></div></div>
			<div class="tph-step"><div class="tph-num">3</div><div><h3>You get a fair cash offer</h3><p>No repairs, no fees, no commissions. If the offer works for you, you pick the closing date.</p></div></div>
		</div>
		<?php if ( $phone_link ) : ?>
			<a class="tph-cta" href="<?php echo esc_attr( $phone_link ); ?>">Can't wait? Call us now</a>
		<?php endif; ?>
		<div class="tph-contact">
			<strong>Turning Point Homes</strong><br>
			<?php echo esc_html( TPH_ADDRESS ); ?><br>
			<?php if ( $phone_link ) : ?>
				<a href="<?php echo esc_attr( $phone_link ); ?>"><?php echo esc_html( TPH_PHONE ); ?></a> &middot;
			<?php endif; ?>
			<a href="mailto:<?php echo esc_attr( TPH_EMAIL ); ?>"><?php echo esc_html( TPH_EMAIL ); ?></a>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

// The thank-you page has no search value and would only confuse analytics.
add_filter(
	'wp_robots',
	function ( $robots ) {
		if ( is_page( TPH_THANK_YOU_SLUG ) ) {
			$robots['noindex']  = true;
			$robots['nofollow'] = true;
		}
		return $robots;
	}
);

/* ------------------------------------------------------------------ */
/* 3. LocalBusiness schema on every page                              */
/* ------------------------------------------------------------------ */

add_action( 'wp_head', 'tph_print_schema' );

function tph_business_schema() {
	$cities = [ 'Independence', 'Kansas City', 'Blue Springs', "Lee's Summit", 'Raytown', 'Grain Valley', 'Sugar Creek', 'Buckner', 'Oak Grove', 'Grandview' ];
	$schema = [
		'@context'        => 'https://schema.org',
		'@type'           => 'LocalBusiness',
		'@id'             => home_url( '/#business' ),
		'name'            => 'Turning Point Homes',
		'description'     => 'Turning Point Homes buys houses for cash in Independence, Kansas City, and the surrounding area. Sell as-is with no repairs, no agent commissions, and a closing date you choose.',
		'url'             => home_url( '/' ),
		'email'           => TPH_EMAIL,
		'address'         => [
			'@type'           => 'PostalAddress',
			'streetAddress'   => '25209 E Blue Mills Rd',
			'addressLocality' => 'Independence',
			'addressRegion'   => 'MO',
			'postalCode'      => '64058',
			'addressCountry'  => 'US',
		],
		'areaServed'      => array_merge(
			array_map(
				function ( $city ) {
					return [ '@type' => 'City', 'name' => $city . ', MO' ];
				},
				$cities
			),
			[ [ '@type' => 'AdministrativeArea', 'name' => 'Jackson County, MO' ] ]
		),
		'potentialAction' => [
			'@type'  => 'QuoteAction',
			'name'   => 'Get a cash offer',
			'target' => home_url( '/sell-your-house/' ),
		],
	];
	if ( TPH_PHONE ) {
		$schema['telephone'] = TPH_PHONE;
	}
	return $schema;
}

function tph_print_schema() {
	echo '<script type="application/ld+json">' . wp_json_encode( tph_business_schema(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
}

/* ------------------------------------------------------------------ */
/* 4. Correct the business address wherever the old one appears        */
/* ------------------------------------------------------------------ */

add_action(
	'template_redirect',
	function () {
		if ( TPH_OLD_ADDRESSES && ! is_admin() ) {
			ob_start( 'tph_fix_address' );
		}
	}
);

function tph_fix_address( $html ) {
	return str_ireplace( TPH_OLD_ADDRESSES, TPH_ADDRESS, $html );
}

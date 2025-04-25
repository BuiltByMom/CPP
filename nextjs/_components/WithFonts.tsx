/************************************************************************************************
 ** WithFonts Component
 **
 ** A wrapper component that provides font configuration for the application.
 ** It sets up the Geist Mono font family and makes it available through CSS variables.
 **
 ** Usage:
 ** - Wrap your application or specific sections with this component to apply the font
 ** - Provides consistent typography across the application
 ** - Sets up CSS variables for font family access
 **
 ** Dependencies:
 ** - next/font/google: For font loading and optimization
 ** - React: For component rendering
 ************************************************************************************************/

'use client';

import {Geist_Mono} from 'next/font/google';

import type {ReactElement, ReactNode} from 'react';

/************************************************************************************************
 ** geistMono
 **
 ** Configuration for the Geist Mono font from Google Fonts.
 ** Sets up multiple weights and optimizes font loading with swap display.
 **
 ** Note:
 ** - Uses Latin subset for optimal loading
 ** - Configures font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
 ** - Sets up CSS variable for global access
 ************************************************************************************************/
const geistMono = Geist_Mono({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--geist-mono-font'
});

/************************************************************************************************
 ** WithFonts
 **
 ** A wrapper component that applies the Geist Mono font to its children.
 **
 ** @param props - Component props
 **   - children: React nodes to be wrapped with the font configuration
 **
 ** @returns ReactElement
 **
 ** Example:
 ** <WithFonts>
 **   <YourComponent />
 ** </WithFonts>
 ************************************************************************************************/
export function WithFonts({children}: {children: ReactNode}): ReactElement {
	return (
		<div style={{fontFamily: `${geistMono.style.fontFamily}`}}>
			<style jsx global>
				{`
					:root {
						--geist-mono-font: ${geistMono.style.fontFamily};
					}
				`}
			</style>

			{children}
		</div>
	);
}

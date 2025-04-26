// ==UserScript==
// @name         Graal Online 2FA QR Code Fix
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fix broken 2FA QR codes on Graal Online
// @author       Denveous
// @match        https://www.graalonline.com/accounts/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/kjua@0.9.0/dist/kjua.min.js
// ==/UserScript==
(function() {
'use strict';
function init() {
    console.log('Graal Online 2FA QR Code Fix script is running');
    setTimeout(function() {
        const otpauthLinks = document.querySelectorAll('a[href^="otpauth://"]');
        for (const link of otpauthLinks) {
            const imgTag = link.querySelector('img[src^="data:image/png;base64,"]');
            if (imgTag) {
                const src = imgTag.getAttribute('src');
                if (src === 'data:image/png;base64,' || src.endsWith('base64,')) {
                    console.log('Found broken QR code image, fixing...');
                    const href = link.getAttribute('href');
                    let secret = null;
                    if (href && href.includes('otpauth://')) {
                        try {
                            const url = new URL(href);
                            secret = url.searchParams.get('secret');
                            console.log('Found secret in href:', secret);
                        } catch (e) { console.error('Error parsing otpauth URL:', e); }
                    }
                    if (secret) {
                        const h1Tag = link.querySelector('h1');
                        if (h1Tag) link.removeChild(h1Tag);
                        const qrCodeEl = kjua({
                            text: href,
                            size: 200,
                            crisp: false,
                            rounded: 100,
                            quiet: 1,
                            render: 'image'
                        });
                        qrCodeEl.width = '200px';
                        qrCodeEl.height = '200px';
                        imgTag.replaceWith(qrCodeEl);
                        const backupEl = document.createElement('h1');
                        backupEl.textContent = `Backup Code: ${secret.substring(0, 5)}`;
                        link.appendChild(backupEl);
                        const extraContainer = document.createElement('div');
                        extraContainer.style.margin = '10px auto';
                        extraContainer.style.padding = '10px';
                        extraContainer.style.borderRadius = '5px';
                        extraContainer.style.maxWidth = '300px';
                        extraContainer.style.backgroundColor = 'transparent';
                        const extraHeading = document.createElement('div');
                        extraHeading.textContent = 'Additional Options';
                        extraHeading.style.fontWeight = 'bold';
                        extraHeading.style.marginBottom = '10px';
                        extraContainer.appendChild(extraHeading);
                        const secretText = document.createElement('div');
                        secretText.innerHTML = `<span style="color:white;font-weight:bold">Full Secret:</span> ${secret}`;
                        secretText.style.fontFamily = 'monospace';
                        secretText.style.padding = '5px';
                        secretText.style.marginBottom = '10px';
                        secretText.style.backgroundColor = 'transparent';
                        secretText.style.borderRadius = '3px';
                        secretText.style.fontSize = '12px';
                        extraContainer.appendChild(secretText);
                        const copyButton = document.createElement('button');
                        copyButton.textContent = 'Copy Secret';
                        copyButton.style.padding = '5px 10px';
                        copyButton.style.margin = '5px';
                        copyButton.style.backgroundColor = '#3498db';
                        copyButton.style.color = 'white';
                        copyButton.style.border = 'none';
                        copyButton.style.borderRadius = '3px';
                        copyButton.style.cursor = 'pointer';
                        copyButton.addEventListener('click', function(e) {
                            navigator.clipboard.writeText(secret).then(function() {
                                copyButton.textContent = 'Copied!';
                                setTimeout(function() { copyButton.textContent = 'Copy Secret'; }, 2000);
                            });
                        });
                        copyButton.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        });
                        extraContainer.appendChild(copyButton);
                        link.parentNode.insertBefore(extraContainer, link.nextSibling);
                        console.log('Successfully replaced broken QR code');
                    } else {
                        console.error('Could not extract secret from otpauth URL');
                    }
                }
            }
        }
    }, 1000);
}
init();
})();
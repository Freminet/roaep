// ==UserScript==
// @name         ROAEP counter
// @namespace    https://lau.cat/
// @version      1.2-br
// @description  Vote counter for ROAEP
// @author       Lau
// @include      https://prezenta.roaep.ro/prezidentiale*
// @include      https://prezenta.roaep.ro/parlamentare*
// @icon         https://prezenta.roaep.ro/prezidentiale24112024/favicon/apple-touch-icon.png
// @downloadURL  https://raw.githubusercontent.com/Freminet/roaep/master/roaep.user.js
// @updateURL    https://raw.githubusercontent.com/Freminet/roaep/master/roaep.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    const updateVotes = async () => {
        try {
            const response = await fetch('https://raw.githubusercontent.com/Freminet/roaep/refs/heads/main/details.json');
            const data = await response.json();

            const isParlamentare = location.href.includes('/parlamentare');
            const isRomaniaPage = location.href.includes('/romania/');

            let totalVotes;
            if (isParlamentare) {
                totalVotes = data.votesParlamentare;
            } else {
                totalVotes = isRomaniaPage ? data.votesRomania : data.votesAbroad;
            }

            let remainingVotes = totalVotes - [...document.querySelectorAll('.text-right.display-flex.flex-column')].reduce((sum, element) => {
                const value = parseFloat(
                    element.querySelector('span')?.textContent.replace(/\./g, '').replace(',', '.') || 0
                );
                return sum + value;
            }, 0);

            remainingVotes = Math.max(0, remainingVotes);

            const voturiElement = document.querySelector('#voturi');
            if (voturiElement) {
                voturiElement.textContent = remainingVotes.toLocaleString();
            } else {
                console.warn('Element #voturi not found!');
            }
        } catch (error) {
            console.error('Failed to fetch or update votes:', error);
        }
    };

    const debouncedUpdate = debounce(updateVotes, 100);
    const toggleVotesVisibility = () => {
        const votesElement = document.querySelector('#voturi')?.closest('div[style*="min-width: 100px;"]');
        const totalLabel = document.querySelector('#nivel-selector .app-tabs-option:first-child');
        const isTotalSelected = totalLabel?.classList.contains('active');

        if (votesElement) {
            votesElement.style.display = isTotalSelected ? 'block' : 'none';
        }
    };

    const waitForElement = () => {
        const targetElement = document.querySelector('div[style*="min-width: 100px;"]');
        if (targetElement && !document.querySelector('#voturi')) {
            const clonedElement = targetElement.cloneNode(true);
            clonedElement.querySelector('.text-muted').textContent = 'Voturi rămase:';
            clonedElement.querySelector('.app-tabs').innerHTML =
                `<label class="btn app-tabs-option active">
                    <input type="radio" name="options" checked=""/>
                    <span id="voturi"></span>
                </label>`;
            targetElement.parentNode.append(clonedElement);
            targetElement.id = 'nivel-selector';

            toggleVotesVisibility();
            updateVotes();
        }
    };

    new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (!document.querySelector('#voturi')) {
                waitForElement();
            }
            toggleVotesVisibility();
            debouncedUpdate();
        }
    }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class']
    });
})();

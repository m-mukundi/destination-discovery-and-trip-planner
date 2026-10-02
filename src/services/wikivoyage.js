const WIKIVOYAGE_API = "https://en.wikivoyage.org/w/api.php";
const WIKIVOYAGE_SUMMARY = "https://en.wikivoyage.org/api/rest_v1/page/summary";

//Fetches the summary for the exact page title and returns null if unavailable
async function fetchSummary(title) {
    const response = await fetch(
        `${WIKIVOYAGE_SUMMARY}/${encodeURIComponent(title)}`,
    { headers: { Accept: "application/json" } }
    );

    // 404 error
    if(response.status === 404) return null;

    if(!response.ok){
        throw new Error(`Wikivoyage request failed: ${response.status}`);
    }

    return response.json();
}

//Fallback loop...if the title doesnt exists, searches Wikivoyage
//and returns a title of best fit or null if non-existant

async function searchTitle(query) {
    const params = new URLSearchParams({
        action: 'query', 
        list: 'search',
        srsearch: query,
        srlimit: '1',
        format: 'json',
        origin: '*', //For CORS in the browser
    })

    const response = await  fetch(`${WIKIVOYAGE_API}?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Wikivoyage search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.query?.search?.[0]?.title ?? null;  
}

/**
 * Get a short overview of a destination.
 *
 * @param {string} name - Destination name, e.g. "Nakuru". Use the Nominatim
 *   result's `name` field (short), not `display_name` (long, won't match a page).
 * @returns {Promise<{title: string, extract: string, url: string|null} | null>}
 *   An object with the overview text, or null if Wikivoyage has no page.
 * @throws {Error} on network or HTTP failures.
 */

export async function getDestinationOverview(name) {
    let summary = await fetchSummary(name);

    // for best match
    if(!summary) {
        const title = await searchTitle(name);
        if (!title) return null;
        summary = await fetchSummary(title);
    }

    if (!summary || !summary.extract) return null;

    return {
        title: summary.title,
        extract: summary.extract,
        url: summary.content_urls?.desktop?.page ?? null, 
    };
    
}
const loading = document.getElementById('loading');
document.getElementById('clothingForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    console.log("Button Pushed");
    
    loading.style.display = 'block';

    postDesc();
    const results = await getPrices();
    displayResults(results);
});

async function postDesc(){
    const description = document.getElementById('description').value;
    if(description == '') {return}

    const res = await fetch(('/desc'), {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            parcel: description
        })
    });
}

async function getPrices(){
    const response = await fetch('/pricing', 
        {
            method: 'GET'
        }
    );
    const data = await response.json();
    return data;
}


function displayResults(results) {
    loading.style.display = 'none';
    const resultsSection = document.getElementById('results');
    resultsSection.innerHTML = '';
    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('result');

        const site = document.createElement('p');
        site.textContent = `Site: ${result.site}`;

        const price = document.createElement('p');
        price.textContent = `Price: $${result.price}`;

        const itemCount = document.createElement('p');
        itemCount.textContent = `Total Results: ${result.results}`;

        if(result.results == 0)
        {
            const warning = document.createElement('p');
            warning.textContent =  "Try a more general search description";
            resultDiv.appendChild(warning);
        }
        else if(result.results > 200)
        {
            const warning = document.createElement('p');
            if(result.site == "Thredup")
            {
                warning.textContent = "The returned results is greater than the 120 results per page limit. Thredup will not have an accurate result";
            }
            else
            {
                warning.textContent = "It is recommended to have less than 200 results. Try adding more description to your search (size, material, pattern, etc.)";
            }
            resultDiv.appendChild(warning);
        }

        resultDiv.appendChild(site);
        resultDiv.appendChild(price);
        resultDiv.appendChild(itemCount);
        resultsSection.appendChild(resultDiv);

 
    });
}
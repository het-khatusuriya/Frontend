let selectedModel, selectedSize, selectedOrientation, selectedVariation;

const modelMap = {
    'Adam': '1',
    'Eve': '2',
    'Eli': '3',
    'Vyom': '4'
};

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById('optionsSection').style.display = 'none';
    document.getElementById(sectionId).classList.add('active');
}

function toggleSubSection(header) {
    const subSection = header.parentElement;
    subSection.classList.toggle('active');
}

function selectModel(card) {
    const siblings = card.parentElement.querySelectorAll('.model-card');
    siblings.forEach(model => model.classList.remove('selected'));
    card.classList.add('selected');
    selectedModel = card.querySelector('.model-name').textContent;
}

function selectSize(button) {
    const siblings = button.parentElement.querySelectorAll('.size-btn');
    siblings.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedSize = button.textContent;
}

function selectOrientation(button) {
    const siblings = button.parentElement.querySelectorAll('.orientation-btn');
    siblings.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedOrientation = button.textContent;
}

function loadImage() {
    const input = document.getElementById('painting-upload');
    const imagePreview = document.getElementById('imagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        imagePreview.innerHTML = '<p>No image selected</p>';
    }
}

function selectMockup(card) {
    const siblings = card.parentElement.querySelectorAll('.mockup-card');
    siblings.forEach(model => model.classList.remove('selected'));
    card.classList.add('selected');
    selectedVariation = card.dataset.variation;
        generateFinalPainting();
}
async function waitForGradio() {
    const maxAttempts = 20;
    let attempts = 0;
    
    while (typeof gradio === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    
    if (typeof gradio === 'undefined') {
        throw new Error('Gradio client failed to load after multiple attempts. Please refresh the page and try again.');
    }
    
    return gradio.Client;
}

async function generateMockups() {
    const input = document.getElementById('painting-upload');
    const basePrompt = document.getElementById('base-prompt').value;
    const clothesAccessories = document.getElementById('clothes-accessories').value;
    const frameDescription = document.getElementById('frame-description').value;

    // Validation
    if (!input.files || !input.files[0]) {
        alert('Please upload an image first!');
        return;
    }
    if (!selectedModel || !selectedSize || !selectedOrientation) {
        alert('Please select a model, size, and orientation!');
        return;
    }
    if (!clothesAccessories) {
        alert('Please enter a Clothes/Accessories Description!');
        return;
    }

    try {
        const Client = await waitForGradio();
        const client = await Client.connect("https://5331c848a3192a3f48.gradio.live/");


        await client.predict("/update_model", { 
            model_selected: modelMap[selectedModel]
        });
        await client.predict("/painting_size", { 
            choice: selectedSize 
        });
        const imageFile = input.files[0];
        await client.predict("/update_dimensions", { 
            image: imageFile 
        });
        await client.predict("/orientation", { 
            orientation: selectedOrientation 
        });
        const fullPrompt = `${basePrompt || ''} ${clothesAccessories} ${frameDescription || ''}`.trim();
        await client.predict("/normal_image", { 
            prompt: fullPrompt,
            position: "yes" 
        });
        const mockupsContainer = document.getElementById('mockupsContainer');
        mockupsContainer.innerHTML = '';

        for (let i = 1; i <= 3; i++) {
            const result = await client.predict("/final_generation", { 
                Variation: i.toString()
            });
            const imageUrl = Array.isArray(result.data) ? result.data[0] : result.data;
            const mockupCard = document.createElement('div');
            mockupCard.className = 'mockup-card';
            mockupCard.dataset.variation = i.toString();
            mockupCard.onclick = () => selectMockup(mockupCard);
            mockupCard.innerHTML = `<img src="${imageUrl}" alt="Mockup ${i}">`;
            mockupsContainer.appendChild(mockupCard);
        }

    } catch (error) {
        console.error("Error generating mockups:", error);
        alert("An error occurred while generating the mockups: " + error.message);
    }
}

async function generateFinalPainting() {
    if (!selectedVariation) {
        alert('Please select a mockup first!');
        return;
    }

    try {
        const Client = await waitForGradio();
        const client = await Client.connect("https://e09a64fe7305d2f849.gradio.live");
        
        const finalResult = await client.predict("/final_generation", { 
            Variation: selectedVariation 
        });

        const imageUrl = Array.isArray(finalResult.data) ? finalResult.data[0] : finalResult.data;

        const finalImage = document.getElementById('finalImage');
        finalImage.src = imageUrl;
        document.getElementById('mockupsContainer').style.display = 'none';
        document.getElementById('finalOutput').style.display = 'block';

    } catch (error) {
        console.error("Error generating final painting:", error);
        alert("An error occurred while generating the final painting: " + error.message);
    }
}
async function generateScene() {
    const scenePrompt = document.getElementById('scene-prompt').value;

    if (!selectedModel) {
        alert('Please select a model!');
        return;
    }
    if (!scenePrompt) {
        alert('Please enter a scene prompt!');
        return;
    }

    try {
        const client = await gradio.Client.connect("https://8159f02006714e864f.gradio.live/");
        
        await client.predict("/update_model_2", { 
            model_selected: modelMap[selectedModel] 
        });
        
        const result = await client.predict("/normal_image", { 
            prompt: scenePrompt 
        });

        const sceneFinalImage = document.getElementById('sceneFinalImage');
        sceneFinalImage.src = result.data;
        document.getElementById('sceneFinalOutput').style.display = 'block';

    } catch (error) {
        console.error("Error generating scene:", error);
        alert("An error occurred while generating the scene: " + error.message);
    }
}
function downloadImage() {
    const imageSrc = document.getElementById('finalImage').src;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'virtual-curator-painting.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function restartProcess() {
    window.location.reload();
}

function generateScene() {
    const sceneFinalImage = document.getElementById('sceneFinalImage');
    sceneFinalImage.src = "https://via.placeholder.com/600x400"; 
    document.getElementById('sceneFinalOutput').style.display = 'block';
}

function downloadSceneImage() {
    const imageSrc = document.getElementById('sceneFinalImage').src;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'virtual-curator-scene.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function restartSceneProcess() {
    window.location.reload();
}
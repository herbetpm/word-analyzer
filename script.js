const knownWords = new Set();
const unknownWords = new Set();

document.getElementById('analyzeButton').addEventListener('click', () => {
    analyzeText();
});

function syncWordsRealTime() {
    const wordsCollection = collection(db, "words");

    onSnapshot(wordsCollection, (snapshot) => {
        knownWords.clear();
        unknownWords.clear();

        snapshot.forEach((doc) => {
            const wordData = doc.data();
            if (wordData.category === 'known') {
                knownWords.add(wordData.word);
            } else if (wordData.category === 'unknown') {
                unknownWords.add(wordData.word);
            }
        });

        // Después de sincronizar las palabras con la base de datos, analizamos de nuevo el texto
        analyzeText();
    });
}

async function analyzeText() {
    const textInput = document.getElementById('textInput');
    const textValue = textInput.value.toLowerCase();
    const wordsArray = textValue.match(/\b\w+\b/g);
    const uniqueWords = [...new Set(wordsArray)];

    // Filtrar palabras nuevas
    const newWords = uniqueWords.filter(word => !knownWords.has(word) && !unknownWords.has(word));

    displayWords(newWords);
    highlightText(); // Asegura que el texto siempre se resalte, incluso si no hay nuevas palabras

    // Borra el campo de texto después de analizar
    textInput.value = '';
}

function displayWords(words = []) {
    const wordsContainer = document.getElementById('wordsContainer');
    wordsContainer.innerHTML = '';

    if (words.length > 0) {
        words.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const wordSpan = document.createElement('span');
            wordSpan.textContent = word;

            const knownButton = document.createElement('button');
            knownButton.textContent = 'Known';
            knownButton.className = 'known';
            knownButton.addEventListener('click', () => markWordAs(word, 'known', wordItem));

            const unknownButton = document.createElement('button');
            unknownButton.textContent = 'Unknown';
            unknownButton.className = 'unknown';
            unknownButton.addEventListener('click', () => markWordAs(word, 'unknown', wordItem));

            wordItem.appendChild(wordSpan);
            wordItem.appendChild(knownButton);
            wordItem.appendChild(unknownButton);

            wordsContainer.appendChild(wordItem);
        });

        document.getElementById('wordList').classList.remove('hidden');
    } else {
        document.getElementById('wordList').classList.add('hidden');
    }
}

async function markWordAs(word, status, wordItem) {
    try {
        const docRef = doc(db, "words", word);
        await setDoc(docRef, {
            word: word,
            category: status
        });

        if (status === 'known') {
            knownWords.add(word);
            unknownWords.delete(word);
        } else {
            unknownWords.add(word);
            knownWords.delete(word);
        }

        wordItem.remove(); // Remove the word from the list after it's classified
        highlightText();
    } catch (error) {
        console.error("Error saving word to Firebase:", error);
    }
}

function highlightText() {
    const textInput = document.getElementById('textInput').value;
    const highlightedTextContainer = document.getElementById('highlightedText');

    let highlightedText = textInput;

    unknownWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="highlight">${word}</span>`);
    });

    highlightedTextContainer.innerHTML = highlightedText;
    document.getElementById('highlightedTextContainer').classList.remove('hidden');
}

// Escuchar cambios en tiempo real y actualizar la interfaz
syncWordsRealTime();

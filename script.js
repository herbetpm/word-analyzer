const knownWords = new Set();
const unknownWords = new Set();

document.getElementById('analyzeButton').addEventListener('click', () => {
    analyzeText();
});

document.getElementById('clearButton').addEventListener('click', () => {
    clearAnalyzedText();
});

function syncWordsRealTime() {
    const wordsCollection = collection(db, "words");

    onSnapshot(wordsCollection, (snapshot) => {
        knownWords.clear();
        unknownWords.clear();

        snapshot.forEach((doc) => {
            const wordData = doc.data();
            if (wordData.category === 'known') {
                knownWords.add(wordData.word.toLowerCase());
            } else if (wordData.category === 'unknown') {
                unknownWords.add(wordData.word.toLowerCase());
            }
        });

        // Después de sincronizar las palabras con la base de datos, analizamos de nuevo el texto
        analyzeText();
    });
}

function analyzeText() {
    const textInput = document.getElementById('textInput').value;
    // Modificación de la expresión regular para incluir diferentes tipos de apóstrofes y guiones
    const wordsArray = textInput.match(/\b[\w'’\-]+\b/g); 
    const uniqueWords = [...new Set(wordsArray)];

    const newWords = uniqueWords.filter(word => !knownWords.has(word.toLowerCase()) && !unknownWords.has(word.toLowerCase()));

    displayWords(newWords);
    highlightText();
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
        const docRef = doc(db, "words", word.toLowerCase());
        await setDoc(docRef, {
            word: word.toLowerCase(),
            category: status
        });

        if (status === 'known') {
            knownWords.add(word.toLowerCase());
            unknownWords.delete(word.toLowerCase());
        } else {
            unknownWords.add(word.toLowerCase());
            knownWords.delete(word.toLowerCase());
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
        // Usar una expresión regular que considere los diferentes apóstrofes y guiones
        const regex = new RegExp(`\\b${word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="highlight">${word}</span>`);
    });

    highlightedTextContainer.innerHTML = highlightedText;
    document.getElementById('highlightedTextContainer').classList.remove('hidden');
}

function clearAnalyzedText() {
    document.getElementById('textInput').value = ''; // Borra el campo de entrada de texto
    document.getElementById('highlightedTextContainer').classList.add('hidden'); // Oculta el contenedor del texto resaltado
    document.getElementById('highlightedText').innerHTML = ''; // Limpia el contenido resaltado
    document.getElementById('wordsContainer').innerHTML = ''; // Limpia la lista de nuevas palabras
    document.getElementById('wordList').classList.add('hidden'); // Oculta la lista de palabras
}

// Escuchar cambios en tiempo real y actualizar la interfaz
syncWordsRealTime();

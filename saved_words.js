const knownWords = new Set();
const unknownWords = new Set();
let allWords = [];

function syncWordsRealTime() {
    const wordsCollection = collection(db, "words");
    
    onSnapshot(wordsCollection, (snapshot) => {
        knownWords.clear();
        unknownWords.clear();
        allWords = [];

        snapshot.forEach((doc) => {
            const wordData = doc.data();
            if (wordData.category === 'known') {
                knownWords.add(wordData.word);
            } else if (wordData.category === 'unknown') {
                unknownWords.add(wordData.word);
            }
        });

        allWords = [...knownWords, ...unknownWords].sort();
        displaySavedWords();
    });
}

function displaySavedWords(filter = '') {
    const savedWordsContainer = document.getElementById('savedWordsContainer');
    savedWordsContainer.innerHTML = '';

    allWords.forEach(word => {
        if (word.startsWith(filter.toLowerCase())) {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete';
            deleteButton.addEventListener('click', () => deleteWord(word, wordItem));

            const knownButton = document.createElement('button');
            knownButton.textContent = 'Known';
            knownButton.className = 'known';
            if (knownWords.has(word)) {
                knownButton.classList.add('active');
            }

            const unknownButton = document.createElement('button');
            unknownButton.textContent = 'Unknown';
            unknownButton.className = 'unknown';
            if (unknownWords.has(word)) {
                unknownButton.classList.add('active');
            }

            knownButton.addEventListener('click', () => updateWordStatus(word, 'known', knownButton, unknownButton));
            unknownButton.addEventListener('click', () => updateWordStatus(word, 'unknown', knownButton, unknownButton));

            const wordSpan = document.createElement('span');
            wordSpan.textContent = word;

            wordItem.appendChild(deleteButton);
            wordItem.appendChild(knownButton);
            wordItem.appendChild(unknownButton);
            wordItem.appendChild(wordSpan);

            savedWordsContainer.appendChild(wordItem);
        }
    });
}

document.getElementById('addWordButton').addEventListener('click', async () => {
    const newWord = document.getElementById('newWordInput').value.toLowerCase();
    const category = document.getElementById('wordCategory').value;

    if (newWord && !knownWords.has(newWord) && !unknownWords.has(newWord)) {
        try {
            const docRef = doc(db, "words", newWord);
            await setDoc(docRef, {
                word: newWord,
                category: category
            });

            document.getElementById('newWordInput').value = ''; // Limpiar el campo de entrada
        } catch (error) {
            console.error("Error adding word to Firebase:", error);
        }
    }
});

document.getElementById('searchWordInput').addEventListener('input', (event) => {
    const filter = event.target.value.toLowerCase();
    displaySavedWords(filter);
});

async function updateWordStatus(word, status, knownButton, unknownButton) {
    try {
        const docRef = doc(db, "words", word);
        await setDoc(docRef, {
            word: word,
            category: status
        });

        if (status === 'known') {
            knownWords.add(word);
            unknownWords.delete(word);
            knownButton.classList.add('active');
            unknownButton.classList.remove('active');
        } else {
            unknownWords.add(word);
            knownWords.delete(word);
            unknownButton.classList.add('active');
            knownButton.classList.remove('active');
        }
    } catch (error) {
        console.error("Error updating word in Firebase:", error);
    }
}

async function deleteWord(word, wordItem) {
    try {
        const docRef = doc(db, "words", word);
        await deleteDoc(docRef);

        wordItem.remove(); // Eliminar el elemento de la DOM inmediatamente
    } catch (error) {
        console.error("Error deleting word from Firebase:", error);
    }
}

// Escuchar cambios en tiempo real
syncWordsRealTime();
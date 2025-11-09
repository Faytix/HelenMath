let lang = 'ru';
document.body.classList.add(lang);

function switchLanguage(newLang) {
    document.body.classList.remove(lang);
    lang = newLang;
    document.body.classList.add(lang);
}

function showSolver() {
    document.getElementById('theory-section').style.display = 'none';
    document.getElementById('solver-section').style.display = 'block';
    document.getElementById('solver-section').style.animation = 'fade-in 1s';
}

function showTheory() {
    document.getElementById('solver-section').style.display = 'none';
    document.getElementById('theory-section').style.display = 'block';
    document.getElementById('theory-section').style.animation = 'fade-in 1s';
    // Очистка результатов и графика при возврате (опционально)
    document.getElementById('results').innerHTML = '';
    document.getElementById('chart').style.display = 'none';
    document.getElementById('warning').style.display = 'none';
}

function generateInputs() {
    const n = parseInt(document.getElementById('n').value);
    if (isNaN(n) || n < 1 || n > 10) {
        alert(lang === 'ru' ? 'Неверная размерность! От 1 до 10.' : 'Invalid size! From 1 to 10.');
        document.getElementById('n').value = '';
        toggleGuide('n-guide', true);
        return;
    }
    let html = '<h2 data-lang="ru">Матрица A:</h2><h2 data-lang="en">Matrix A:</h2><table>';
    for (let i = 0; i < n; i++) {
        html += '<tr>';
        for (let j = 0; j < n; j++) {
            html += `<td><input type="number" id="a${i}${j}" value="0"></td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    html += '<h2 data-lang="ru">Вектор b:</h2><h2 data-lang="en">Vector b:</h2><div id="b-inputs">';
    for (let i = 0; i < n; i++) {
        html += `<input type="number" id="b${i}" value="0"> `;
    }
    html += '</div>';

    // 🔹 Новая подсказка о вводе дробей и целых чисел
    html += `
        <div class="note">
            <p data-lang="ru">💡 Если хотите написать дробное число, допускается ввод через запятую или точку. Для целых чисел достаточно простого числа.</p>
            <p data-lang="en">💡 You can use either a comma or a dot for decimal numbers. For integers, just type a whole number.</p>
        </div>
    `;

    document.getElementById('matrix-inputs').innerHTML = html;
}

function toggleGuide(id, blink = false) {
    const guide = document.getElementById(id);
    guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
    if (blink) {
        guide.classList.add('blink');
        setTimeout(() => guide.classList.remove('blink'), 3000);
    }
}

function loadExample() {
    document.getElementById('n').value = 2;
    generateInputs();
    document.getElementById('a00').value = 4;
    document.getElementById('a01').value = 1;
    document.getElementById('a10').value = 1;
    document.getElementById('a11').value = 3;
    document.getElementById('b0').value = 5;
    document.getElementById('b1').value = 4;
    document.getElementById('x0').value = '0,0';
    document.getElementById('epsilon').value = 0.01;
}

function getMatrix(n, prefix) {
    let mat = [];
    for (let i = 0; i < n; i++) {
        if (prefix === 'b') {
            const val = parseFloat(document.getElementById(`${prefix}${i}`).value.replace(',', '.'));
            if (isNaN(val)) {
                alert(lang === 'ru' ? 'Неверное значение в b!' : 'Invalid value in b!');
                throw new Error();
            }
            mat.push(val);
        } else {
            let row = [];
            for (let j = 0; j < n; j++) {
                const val = parseFloat(document.getElementById(`${prefix}${i}${j}`).value.replace(',', '.'));
                if (isNaN(val)) {
                    alert(lang === 'ru' ? 'Неверное значение в A!' : 'Invalid value in A!');
                    throw new Error();
                }
                row.push(val);
            }
            mat.push(row);
        }
    }
    return mat;
}

function checkDiagonalDominance(A) {
    const n = A.length;
    let strict = false;
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            if (i !== j) sum += Math.abs(A[i][j]);
        }
        if (Math.abs(A[i][i]) < sum) return false;
        if (Math.abs(A[i][i]) > sum) strict = true;
    }
    return strict;
}

function norm(vec, type) {
    if (type === 'max') return Math.max(...vec.map(Math.abs));
    return Math.sqrt(vec.reduce((a, b) => a + b*b, 0));
}

function solve() {
    const n = parseInt(document.getElementById('n').value);
    let A, b, x0, epsilon, maxIter, normType;
    try {
        A = getMatrix(n, 'a');
        b = getMatrix(n, 'b');
        x0 = document.getElementById('x0').value.split(',').map(s => parseFloat(s.replace(',', '.')));
        if (x0.length !== n || x0.some(isNaN)) {
            alert(lang === 'ru' ? 'Неверный x0!' : 'Invalid x0!');
            return;
        }
        epsilon = parseFloat(document.getElementById('epsilon').value);
        maxIter = parseInt(document.getElementById('maxIter').value);
        normType = document.getElementById('normType').value;
    } catch {
        return;
    }

    if (!checkDiagonalDominance(A)) {
        const warning = document.getElementById('warning');
        warning.innerHTML = lang === 'ru'
            ? 'Матрица не имеет диагонального преобладания! Попробуйте переставить уравнения для сходимости.'
            : 'Matrix is not diagonally dominant! Try reordering equations for convergence.';
        warning.style.display = 'block';
        setTimeout(() => warning.style.display = 'none', 5000);
        return;
    }

    let x = [...x0];
    let iterations = [];
    let errors = [];
    for (let k = 0; k < maxIter; k++) {
        let xNew = [];
        for (let i = 0; i < n; i++) {
            let sum1 = 0, sum2 = 0;
            for (let j = 0; j < i; j++) sum1 += A[i][j] * xNew[j];
            for (let j = i+1; j < n; j++) sum2 += A[i][j] * x[j];
            xNew[i] = (b[i] - sum1 - sum2) / A[i][i];
        }
        let errVec = xNew.map((v, i) => v - x[i]);
        let error = norm(errVec, normType);
        iterations.push([...xNew]);
        errors.push(error);
        x = xNew;
        if (error < epsilon) break;
    }

    let html = `<h2 data-lang="ru">Результаты:</h2><h2 data-lang="en">Results:</h2>`;
    html += `<p data-lang="ru">Итераций: ${iterations.length}</p><p data-lang="en">Iterations: ${iterations.length}</p>`;
    html += '<table><tr><th>№</th>';
    for (let i = 0; i < n; i++) html += `<th>x${i+1}</th>`;
    html += '<th>Ошибка</th></tr>';
    iterations.forEach((it, k) => {
        html += `<tr><td>${k+1}</td>`;
        it.forEach(v => html += `<td>${v.toFixed(6)}</td>`);
        html += `<td>${errors[k].toFixed(6)}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('results').innerHTML = html;

    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: errors.map((_, i) => i+1),
            datasets: [{ label: lang === 'ru' ? 'Ошибка' : 'Error', data: errors, borderColor: '#4CAF50' }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
    document.getElementById('chart').style.display = 'block';
}

// Уведомление при загрузке сайта
window.onload = function() {
    alert("Работа сделана Сорокиным Александром Ивановичем группы 22-13");
};
const media = document.getElementById("media");
const desvioPadrao = document.getElementById("desvio");
const valor = document.getElementById("valor");
const tipoPergunta = document.getElementById("tipoPergunta");
const resultado = document.getElementById("resultado");
let myChart;
var resultadoValue = 0;

document.addEventListener("DOMContentLoaded", () => {
  const initialMean = parseFloat(media.value);
  const initialStdDev = parseFloat(desvioPadrao.value);

  if (!isNaN(initialMean) && !isNaN(initialStdDev) && initialStdDev > 0) {
    desenharGrafico(initialMean, initialStdDev);
  } else {
    desenharGrafico(0, 1);
  }

  document.getElementById("calcular").addEventListener("click", () => {
    calcularDistribuicaoNormal();
  });
});

function calcularDistribuicaoNormal() {
  const mediaValue = parseFloat(media.value);
  const desvioPadraoValue = parseFloat(desvioPadrao.value);
  const valorValue = parseFloat(valor.value);
  const tipoPerguntaValue = tipoPergunta.value;

  if (isNaN(mediaValue) || isNaN(desvioPadraoValue) || desvioPadraoValue <= 0) {
    resultado.innerHTML =
      "Por favor, preencha todos os campos corretamente e o Desvio Padrão deve ser maior que zero.";
    return;
  }

  if (tipoPerguntaValue === "menorQue") {
    resultadoValue = calcularMenor(mediaValue, desvioPadraoValue, valorValue);
  } else if (tipoPerguntaValue === "maiorQue") {
    resultadoValue = calcularMaior(mediaValue, desvioPadraoValue, valorValue);
  } else if (tipoPerguntaValue === "entre") {
    const valor2Input = document.getElementById("valor2");
    if (!valor2Input) {
      resultado.textContent =
        "Erro: Campo para o segundo valor (X2) não encontrado.";
      return;
    }
    const valor2Value = parseFloat(valor2Input.value);
    if (isNaN(valor2Value)) {
      resultado.textContent =
        "Por favor, preencha o segundo valor corretamente.";
      return;
    }
    resultadoValue = calcularEntre(
      mediaValue,
      desvioPadraoValue,
      valorValue,
      valor2Value
    );
  } else {
    resultado.textContent = "Selecione um tipo de pergunta válido.";
    return;
  }

  let textoPergunta = "";
  let valor2ForGraph = null;
  if (tipoPerguntaValue === "menorQue") {
    textoPergunta = `P(X < ${valorValue})`;
  } else if (tipoPerguntaValue === "maiorQue") {
    textoPergunta = `P(X > ${valorValue})`;
  } else if (tipoPerguntaValue === "entre") {
    const valor2Value = parseFloat(document.getElementById("valor2").value);
    textoPergunta = `P(${Math.min(valorValue, valor2Value)} < X < ${Math.max(
      valor2Value,
      valorValue
    )})`;
    valor2ForGraph = valor2Value;
  }

  resultado.textContent = `Resultado: ${textoPergunta} é: ${resultadoValue.toFixed(
    4
  )}`;

  desenharGrafico(
    mediaValue,
    desvioPadraoValue,
    tipoPerguntaValue,
    valorValue,
    valor2ForGraph
  );
}

function calcularMenor(media, desvioPadrao, valor) {
  const z = (valor - media) / desvioPadrao;
  return normalCumulativeDistribution(z);
}

function calcularMaior(media, desvioPadrao, valor) {
  const z = (valor - media) / desvioPadrao;
  return 1 - normalCumulativeDistribution(z);
}

function calcularEntre(media, desvioPadrao, valor1, valor2) {
  const z1 = (valor1 - media) / desvioPadrao;
  const z2 = (valor2 - media) / desvioPadrao;
  return normalCumulativeDistribution(z2) - normalCumulativeDistribution(z1);
}

function normalCumulativeDistribution(z) {
  if (z < 0) {
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
  } else {
    return 0.5 * (1 - erf(-z / Math.sqrt(2)));
  }
}

function erf(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1 / (1 + p * x);
  const y =
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * (1 - y);
}

function normalPdf(x, mean, stdDev) {
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
}

function gerarPontosCurva(mean, stdDev, numPoints = 200) {
  const points = [];
  const minX = mean - 4 * stdDev;
  const maxX = mean + 4 * stdDev;
  const step = (maxX - minX) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    const y = normalPdf(x, mean, stdDev);
    points.push({ x: x, y: y });
  }
  return points;
}

function getShadedAreaPoints(allPoints, mean, stdDev, type, val1, val2 = null) {
  let shadedPoints = [];
  let minXBoundary, maxXBoundary;

  switch (type) {
    case "menorQue":
      minXBoundary = allPoints[0].x;
      maxXBoundary = val1;
      break;
    case "maiorQue":
      minXBoundary = val1;
      maxXBoundary = allPoints[allPoints.length - 1].x;
      break;
    case "entre":
      minXBoundary = Math.min(val1, val2);
      maxXBoundary = Math.max(val1, val2);
      break;
    default:
      return [];
  }

  if (
    minXBoundary > allPoints[0].x &&
    minXBoundary < allPoints[allPoints.length - 1].x
  ) {
    shadedPoints.push({
      x: minXBoundary,
      y: normalPdf(minXBoundary, mean, stdDev),
    });
  }

  allPoints.forEach((p) => {
    if (p.x >= minXBoundary && p.x <= maxXBoundary) {
      shadedPoints.push(p);
    }
  });

  if (
    maxXBoundary < allPoints[allPoints.length - 1].x &&
    maxXBoundary > allPoints[0].x
  ) {
    const lastShadedX =
      shadedPoints.length > 0 ? shadedPoints[shadedPoints.length - 1].x : null;
    if (lastShadedX !== maxXBoundary) {
      shadedPoints.push({
        x: maxXBoundary,
        y: normalPdf(maxXBoundary, mean, stdDev),
      });
    }
  }

  shadedPoints.sort((a, b) => a.x - b.x);

  if (shadedPoints.length > 0) {
    shadedPoints.unshift({ x: shadedPoints[0].x, y: 0 });
    shadedPoints.push({ x: shadedPoints[shadedPoints.length - 1].x, y: 0 });
  }

  return shadedPoints;
}

function desenharGrafico(
  mean,
  stdDev,
  tipoPerguntaValue = null,
  valorValue = null,
  valor2Value = null
) {
  const ctx = document
    .getElementById("normalDistributionChart")
    .getContext("2d");

  if (myChart) {
    myChart.destroy();
  }

  const allDataPoints = gerarPontosCurva(mean, stdDev);

  const datasets = [
    {
      label: `(μ=${mean}, σ=${stdDev})`,
      data: allDataPoints,
      borderColor: "#000000",
      backgroundColor: "rgba(0, 0, 0, 0)",
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ];

  if (
    tipoPerguntaValue &&
    valorValue !== null &&
    mean !== null &&
    stdDev !== null &&
    stdDev > 0
  ) {
    const shadedPoints = getShadedAreaPoints(
      allDataPoints,
      mean,
      stdDev,
      tipoPerguntaValue,
      valorValue,
      valor2Value
    );

    if (shadedPoints.length > 0) {
      datasets.push({
        label: `Área Sombreada (${ resultadoValue.toFixed(4) })`,
        data: shadedPoints,
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.7)",
        fill: "origin",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1,
      });
    }
  }

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: "Valor (X)",
            color: "#000000",
          },
          ticks: {
            color: "#000000",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: "Densidade de Probabilidade",
            color: "#000000",
          },
          ticks: {
            color: "#000000",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#000000",
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("pt-BR", {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
    },
  });
}

const parameterInput = document.querySelector('#parameter');
const parameterOutput = document.querySelector('#parameter-output');
const meterFill = document.querySelector('#meter-fill');
const resultText = document.querySelector('#result-text');
const resetButton = document.querySelector('#reset');

function render() {
  const inputValue = Number(parameterInput.value);
  const outputValue = inputValue * 2;
  parameterOutput.value = String(inputValue);
  meterFill.style.width = `${inputValue * 10}%`;
  resultText.textContent = `An input of ${inputValue} produces an output of ${outputValue}.`;
}

parameterInput.addEventListener('input', render);
resetButton.addEventListener('click', () => {
  parameterInput.value = '5';
  render();
  parameterInput.focus();
});

render();

window.onload = () => {
  const loader = document.getElementsByClassName('loader')[0];
  loader.style.border = "calc(15vw / 20) solid var(--done)";
  const loaderText = document.getElementsByClassName('loaderText')[0];
  loaderText.style.color = "var(--done)";
  let text = "Done";
  let timePerLetter = 100;
  let index = 0;
  let interval = setInterval(()=>{
    index++;
    loaderText.innerHTML = text.slice(0, index);
    if(index >= text.length){
      clearInterval(interval);
      setTimeout(()=>{
        document.getElementsByTagName('loading')[0].style.opacity = 0;
        setTimeout(()=>{
          document.getElementsByTagName('loading')[0].style.display = 'none';
        },450);
      },850);
    }
  },timePerLetter);
};

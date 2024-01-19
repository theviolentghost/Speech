class Visualizer {
  audioContext;
  bufferLength;
  dataArray;
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    this.ammountOfBars = config?.ammountOfBars || 19;
    this.autoAdjustAmmountOfBars = config?.autoAdjustAmmountOfBars ?? true;
    this.baseBarWidth = config?.baseBarWidth || 26;
    this.spaceBetweenBars = config?.spaceBetweenBars || 2;
    this.barHeightCalculationType = config?.barHeightCalculationType || "average"; //average, max, min, median
    this.minimumBarHeight = config?.minimumBarHeight || 3;
  }
  adjustAmmountOfBars () {
    if (this.autoAdjustAmmountOfBars) {
      this.ammountOfBars = Math.floor(this.canvas.width / this.baseBarWidth);
      this.ammountOfBars = Math.max(24, this.ammountOfBars);
    }
  }
  displayBlankAudioVisualizer() {
    //this.canvas.width - this.spaceBetweenBars * (this.ammountOfBars - 1);
    let barWidth = (this.canvas.width - (this.spaceBetweenBars * (this.ammountOfBars - 1 ))) / this.ammountOfBars;
    let x = 0;
    for(let i = 0; i < this.ammountOfBars; i++) {
      let barHeight = this.minimumBarHeight;
      //normalize bar height
      barHeight = (barHeight / 255) * this.canvas.height;
      
      this.renderBar(this.ctx, x, this.canvas.height/2 - barHeight/2, barWidth, barHeight, {
        color: getColorForPercent(100 - (barHeight / 255 * 100)),
        opacity: 1,
        anchor: {x: 0.5, y: 0.5},
        angle: 0,
        chamferTopLeft: Math.min(barWidth/2,barHeight/2),
        chamferTopRight: Math.min(barWidth/2,barHeight/2),
        chamferBottomLeft: Math.min(barWidth/2,barHeight/2),
        chamferBottomRight: Math.min(barWidth/2,barHeight/2),
      });
      x += barWidth + this.spaceBetweenBars;
    }
  }
  startAudioVisualizer (stream) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.analyzer = this.audioContext.createAnalyser();

    this.source.connect(this.analyzer);

    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength); 

    this.render();
  }
  render() {
    this.analyzer.getByteFrequencyData(this.dataArray); 

    let groupSize = Math.floor(this.dataArray.length / this.ammountOfBars);
    let barWidth = ((this.canvas.width - (this.spaceBetweenBars * (this.ammountOfBars - 1))) / this.bufferLength) * groupSize;
    let x = 0;

    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
    for(let i = 0; i < this.bufferLength; i+= groupSize) {
      const audioChunks = [];
      for(let j = 0; j < groupSize; j++){
        audioChunks.push(this.dataArray[i + j]);
      } 
      let barHeight = this.calculateBarHeight(audioChunks);
      barHeight = Math.max(this.minimumBarHeight, barHeight);
      let color = getColorForPercent(100 - (barHeight / 255 * 100));
      //normalize bar height
      barHeight = (barHeight / 255) * this.canvas.height;

      this.renderBar(this.ctx, x, this.canvas.height/2 - barHeight/2, barWidth, barHeight, {
        color: color,
        opacity: 1,
        anchor: {x: 0.5, y: 0.5},
        angle: 0,
        chamferTopLeft: Math.min(barWidth/2,barHeight/2),
        chamferTopRight: Math.min(barWidth/2,barHeight/2),
        chamferBottomLeft: Math.min(barWidth/2,barHeight/2),
        chamferBottomRight: Math.min(barWidth/2,barHeight/2),
      });
      x += barWidth + this.spaceBetweenBars;


    }
    requestAnimationFrame(this.render.bind(this));
  }
  calculateBarHeight(elements) {
    switch(this.barHeightCalculationType) {
      case "average":
        return elements.reduce((a, b) => a + b, 0) / elements.length;
      case "max":
        return Math.max(...elements);
      case "min":
        return Math.min(...elements);
      case "median":
        {
          //sort from lowest to highest
          let sorted = elements.sort((a, b) => a - b);
          //if the length of the array is odd, return the middle element
          if(sorted.length % 2 == 1) {
            return sorted[Math.floor(sorted.length / 2)];
          }
          //if the length of the array is even, return the average of the two middle elements
          else {
            return (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
          }
        }
      default:
        return 0;
    }
  }
  renderBar (ctx, x, y, width, height, options = {}) {
    ctx.save();
    ctx.translate(x + (width * options.anchor.x), y + (height * options.anchor.y));
    if (options.angle) { ctx.rotate(options.angle); }
    if (options.opacity != 1) { ctx.globalAlpha = options.opacity }
    ctx.fillStyle = options.color;
    ctx.beginPath();
    ctx.moveTo(-width * options.anchor.x + options.chamferTopLeft, -height * options.anchor.y);
    ctx.arcTo(-width * options.anchor.x + width, -height * options.anchor.y, -width * options.anchor.x + width, -height * options.anchor.y + height, options.chamferTopRight);
    ctx.arcTo(-width * options.anchor.x + width, -height * options.anchor.y + height, -width * options.anchor.x, -height * options.anchor.y + height, options.chamferBottomRight);
    ctx.arcTo(-width * options.anchor.x, -height * options.anchor.y + height, -width * options.anchor.x, -height * options.anchor.y, options.chamferBottomLeft);
    ctx.arcTo(-width * options.anchor.x, -height * options.anchor.y, -width * options.anchor.x + width, -height * options.anchor.y, options.chamferTopLeft);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}


class Settings {
  summaryModels = {
    informative: "Informative",
    conversational: "Conversational",
    catchy: "Catchy",
  };
  summaryTypes = {
    bullets: "Bullets",
    bullets_verbose: "Bullets Verbose",
    gist: "Gist",
    headline: "Headline",
    paragraph: "Paragraph",
  };
  languages = {
    en: {
      name: "English",
    },
    en_us: {
      name: "English (US)",
    },
    en_uk: {
      name: "English (UK)",
    },
    en_au: {
      name: "English (Australia)",
    },
    es: {
      name: "Spanish", 
    },
    fr: {
      name: "French",
    },
    de: {
      name: "German",
    },
    it: {
      name: "Italian",
    },
    ja: {
      name: "Japanese",
    },
    ko: {
      name: "Korean",
    },
    pl: {
      name: "Polish",
    },
    pt: {
      name: "Portuguese",
    },
    nl: {
      name: "Dutch",
    },
    hi: {
      name: "Hindi",
    },
    zh: {
      name: "Chinese",
    },
    fi: {
      name: "Finnish",
    },
    ru: {
      name: "Russian",
    },
    tr: {
      name: "Turkish",
    },
    vi: {
      name: "Vietnamese",
    },
    uk: {
      name: "Ukrainian",
    }
  };
  #settings = {
    language_code: "en_us", /*
      note : that not all languages have all the settings options available,
      
      gbl english: en,
      austrailian english: en_au, 
      english united kingdom: en_uk, 
      english united states: en_us, //default 
      spanish : es, 
      french: fr,
      german: de,
      italian: it,
      japanese: ja,
      korean: ko,
      polish: pl,
      portugesse: pt,
      dutch: nl,
      hindi: hi,
      chinese: zh,
      finnish: fi,
      russian: ru,
      turkish: tr,
      vietnamese: vi,
      ukrainian: uk,

    */
    summarization: false,
    summary_model: 'informative',//informative, conversational, catchy
    summary_type: 'bullets',//bullets, bullets_verbose, gist, headline, paragraph

    content_safety: false, //identify hate speech

    auto_chapters: false, //organize audio

    auto_highlights: false, //words or phrases that are highlighted

    sentiment_analysis: false, //if speaker_labels it'll apply sentiment scores to speaker
    speaker_labels: false, //detects different people talking
    //speakers_expected: 0, //number of speakers expected
  
    entity_detection: false, //Names of people,Organizations,Addresses,Phone numbers,Medical data,Social security numbers

    iab_categories: false, 
  }
  get settings(){
    return this.#settings;
  }
  selectLanguage(languageCode) {
    if(!languageCode || !this.languages[languageCode]) return;
    this.#settings.language_code = languageCode;
    document.getElementById("languageSelect").innerHTML = this.languages[languageCode].name;
  }
  selectSummaryModel (summaryModel) {
    if(!summaryModel || !this.summaryModels[summaryModel]) return;
    this.#settings.summary_model = summaryModel;
    document.getElementById("summaryModelSelect").innerHTML = this.summaryModels[summaryModel];
  }
  selectSummaryType (summaryType) {
    if(!summaryType || !this.summaryTypes[summaryType]) return;
    this.#settings.summary_type = summaryType;
    document.getElementById("sumerizeTypeSelect").innerHTML = this.summaryTypes[summaryType];
  }
}

class Transcriptor {
  constructor(confidenceMinBeforeColorCode) {
    this.transcript = "";
    this.chunks = {};
    this.oldestChunkTimeStamp = 0;
    this.confidenceMinBeforeColorCode = confidenceMinBeforeColorCode || 0.55; //how low the confidence has to be for it to color code
  }
  reset () {
    this.transcript = "";
    this.chunks = {};
    this.oldestChunkTimeStamp = 0;
  }
  onFinal (transcription = {words:[]}) {
    console.log('final');
    this.transcript = "";
    this.chunks = {};
    const words = transcription.words;

    words.forEach(word => {
      this.addWordToChunk(this.chunks, word, 0, 0);
    });

    this.displayTranscript ();
  }
  
  combineTranscription(transcription = {}, chunkTimeStamp = 0, chunkLength = 15000, chunkSize  = 5000, maxChunkSize = 15000) {//not done
    if(!transcription) return;
    
    if(this.oldestChunkTimeStamp > chunkTimeStamp) return;
    this.oldestChunkTimeStamp = chunkTimeStamp;
    
    const words = transcription.words;
    const ammountOfChunks = Math.floor(chunkLength / chunkSize) || 0;
    const maxChunksAmmount = Math.floor(maxChunkSize / chunkSize) || 1;
    let chunksToUse = ammountOfChunks < maxChunksAmmount ? ammountOfChunks : ammountOfChunks - 1;
    let chunkIndexMax = chunkTimeStamp / chunkSize + maxChunksAmmount;
    let chunkIndexMin = (chunksToUse < (maxChunksAmmount - 1) ? 0 : chunkIndexMax - chunksToUse - 1) || 0;

    let temporaryChunks = {}

    for(let word of words) {
      const transcriptStart = word.start + chunkTimeStamp;
      const chunkIndex = Math.floor(transcriptStart / chunkSize);
      if(chunkIndexMin <= chunkIndex && chunkIndex < chunkIndexMax){
        //add word to chunk
        this.addWordToChunk(temporaryChunks, word, chunkIndex, chunkTimeStamp);
      } else {
        break;
      }
      let keys = Object.keys(temporaryChunks);
      for(let key of keys){
        this.chunks[key] = temporaryChunks[key];
      }
      //if(chunkLength == maxChunkSize) this.removeOverlapingTextFromChunks();
    }
  }
  addWordToChunk (temporaryChunks, word, chunkIndex, chunkTime = 0) {
    let newWord = {
      text: word.text,
      start: word.start,
      end: word.end,
      confidence: word.confidence,
      speaker: word.speaker,
      transcriptStart: word.start + chunkTime,
      transcriptEnd: word.end + chunkTime,
    };
    if(!temporaryChunks[chunkIndex]){
      temporaryChunks[chunkIndex] = [newWord];
      return;
    }
    temporaryChunks[chunkIndex].push(newWord);
  }
  removeOverlapingTextFromChunks () {
    /*let keys = Object.keys(this.chunks);
    let previousChunk = null;
    for(let chunkIndex of keys) {
      let chunk = this.chunks[chunkIndex];
      if(previousChunk == null) {
        previousChunk = chunk;
        continue;
      }
      let previousChunkWordIndex = previousChunk.length-1;
      let chunkWordIndex = 0;
      while(chunk[chunkWordIndex] && previousChunk[previousChunkWordIndex] && previousChunk[previousChunkWordIndex].transcriptEnd < chunk[chunkWordIndex].transcriptStart) {
        previousChunk.splice(previousChunkWordIndex, 1);
        previousChunkWordIndex--;
        if(previousChunkWordIndex < 0) break;
      }



      
          
    }*/
  }

  displayTranscript () {
    this.transcript = "";
    const result = document.getElementById("result");
    result.innerHTML = "";
    let customColorGraph = [
        { percent: 0, color: '#bf0808' },   // red
        { percent: 35, color: '#e67722' }, // orange
        { percent: 55, color: '#d9cc16' }, // yellow
        { percent: 80, color: '#31de0a' },  // green
        { percent: 100, color: '#0a98cc' },  // blue
      ];
    let chunkValues = Object.values(this.chunks);
    chunkValues.forEach(chunk => {
      chunk.forEach(word => {
        if(word.confidence <= this.confidenceMinBeforeColorCode) {
          let color = getColorForPercent(word.confidence * 100, customColorGraph);
          let opacity =  1 //0.8 - word.confidence;
          let span = `<span style="color:${color};opacity:${opacity};padding:0.2em;">${word.text}</span> `
          result.innerHTML += span;
        } else {
          result.innerHTML += `${word.text} `;
        }
      });
    });;
    
    result.innerHTML = result.innerHTML.trim();
  }

}

class Microphone {
  #audioType = 'audio/webm';
  #mediaRecorder;
  #audioChunks = [];//all audio chunks from start to finish
  onFinishRecordingFunction = () => {};
  onStartRecordingFunction = () => {};
  constructor(config = {}){
    this.recording = false;
    this.streamRate = config?.streamRate || 4000;//how many ms before new chunk
    this.chunksPerTranscription = config?.chunksPerTranscription || 1; //ammount of audio chunks to send to the server
    this.settings = (config?.settings || new Settings()).settings;
  }
  get audioChunks() {
    return this.#audioChunks;
  }
  get audioType() {
    return this.#audioType;
  }
  async startRecording(sendInterval = this.streamRate, duration){
    if(this.recording) return;
    this.microPhoneStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        document.getElementById("result").style.color = "var(--text)";
        document.getElementById("playStop").className = "stop";
        document.getElementById("resultContainer").style.display = "block";
        //
        visualizer.startAudioVisualizer(stream);
        this.recording = true;
        let sentLast = false;
        this.#mediaRecorder = new MediaRecorder(stream);
        this.#audioChunks = [];
        let chunkTime = 0;
        let skipChunk = true;
        this.onStartRecordingFunction();
  
        this.#mediaRecorder.addEventListener("dataavailable", async (event) => {
          //transcribe audio
          if(!this.recording && sentLast) return;
          
          this.#audioChunks.push(event.data);
          
          if(!this.recording) {
            //on end
            sentLast = true; 
            stream.getTracks().forEach(track => track.stop());
          }
          
          if(sentLast) this.onFinishRecordingFunction(); //last chunk sent
  
          const chunksToSend = this.#audioChunks.slice(-Math.abs(this.chunksPerTranscription || 1));
          
          const audioBlob = new Blob(chunksToSend, { type: this.#audioType });
          const base64Audio = await audioBlobToBase64(audioBlob);

          if(chunksToSend.length >= this.chunksPerTranscription){
            if(!skipChunk){
              chunkTime+=sendInterval;
            } else {
              skipChunk = false;
            }
          }
          sendAudioToApi(
            base64Audio,
            {language_code: this.settings.language_code},
            false,
            chunkTime,
            chunksToSend.length * sendInterval, //chunkLength (time)
            sendInterval, //chunk size (time)
            this.chunksPerTranscription * sendInterval, //maxChunkSize
          );
          if(sentLast) return;
          
          this.#mediaRecorder.start();
        });
        
        this.#mediaRecorder.start();
  
        this.chunkInterval = setInterval(async () => {
          this.#mediaRecorder.stop(); 
        }, sendInterval); 
          
        if(duration){
          setTimeout(() => {
            this.stopRecording();
          }, duration);
        }
    }) 
    .catch(error => {
      //no microphone access
      alert("No microphone access");
      console.log('Microphone access error:', error); 
      let result = document.getElementById("result");
      result.innerHTML = "No microphone access.";
      result.style.color = "var(--denied)";
    });
    //this.microPhoneStream.getTracks().forEach(track => track.stop());
  }
  stopRecording () {
    clearInterval(this.chunkInterval);
    this.#mediaRecorder.stop();
    this.recording = false;
  }
  clearAudioChunks () {
    this.#audioChunks = [];
  }
  onStartRecording(callback) {
    this.onStartRecordingFunction = callback;
  }
  onFinishRecording(callback) {
    this.onFinishRecordingFunction = callback;
  }
}
function toggleMicrophone(){
  if(microphone.recording){
    microphone.stopRecording();
    document.getElementById("playStop").className = "play";
    if(document.getElementById("result").innerHTML.length == 0 || document.getElementById("result").innerHTML === "The Text From the Audio will Appear Here...") document.getElementById("resultContainer").style.display = "none";
  } else {
    microphone.startRecording();
  }
}


function audioBlobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String); 
    };
  }); 
}

function getColorForPercent(percent, customColorsGraph) {
  const colors = customColorsGraph || [
    { percent: 0, color: '#bf0808' },   // red
    { percent: 10, color: '#e67722' }, // orange
    { percent: 25, color: '#d9cc16' }, // yellow
    { percent: 40, color: '#31de0a' },  // green
    { percent: 100, color: '#0a98cc' },  // blue
    { percent: 125, color: "#000"}
  ];

  let color1 = '';
  let color2 = '';
  let percent1 = 0;
  let percent2 = 0;

  // Find the color stops that the input percent falls between
  for (let i = 0; i < colors.length-1; i++) {
    if (percent >= colors[i].percent && percent < colors[i + 1].percent) {
      color1 = colors[i].color;
      color2 = colors[i + 1].color;
      percent1 = colors[i].percent;
      percent2 = colors[i + 1].percent;
      break;
    }
  }
  const t = (percent - percent1) / (percent2 - percent1);
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  const r = Math.round(r1 + t * (r2 - r1)).toString(16).padStart(2, '0');
  const g = Math.round(g1 + t * (g2 - g1)).toString(16).padStart(2, '0');
  const b = Math.round(b1 + t * (b2 - b1)).toString(16).padStart(2, '0');
  const color = "#" + r + g + b;
  return color;
}




const settings = new Settings();
const microphone = new Microphone({settings: settings});
microphone.onFinishRecording(async function() {
  const audioBlob = new Blob(microphone.audioChunks, { type: microphone.audioType });
  const base64Audio = await audioBlobToBase64(audioBlob);

  sendAudioToApi(
    base64Audio,
    microphone.settings,
    true,
  );
  let header = document.getElementsByTagName("contentHeader")[0];
  header.style.fontSize = "5vw";
  document.getElementById("visualizer").style.width = 0;
  /*document.getElementById("settings").style.width = "70%";
  document.getElementById("settings").style.height = "auto";
  document.getElementById("settings").style.padding = "40px";
  document.getElementById("settings").style.overflow = "auto";*/
});
microphone.onStartRecording(function() {
  let header = document.getElementsByTagName("contentHeader")[0];
  header.style.fontSize = 0;
  document.getElementById("visualizer").style.width = "55%";
  document.getElementById("settings").style.width = 0;
  document.getElementById("settings").style.height = 0;
  document.getElementById("settings").style.padding = 0;
  document.getElementById("settings").style.overflow = "hidden";
});
const transcriptor = new Transcriptor();
const visualizer = new Visualizer(document.getElementById("visualizer"),{});
//visualizer.adjustAmmountOfBars();
visualizer.displayBlankAudioVisualizer();
/*window.addEventListener('resize', function() {
  //chnage size of canvas
  visualizer.adjustAmmountOfBars();
});*/





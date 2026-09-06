// Procedural Web Audio: no downloads, no audio before the first user gesture.
export class TactileAudio {
  constructor(){this.enabled=true;this.context=null;this.lastClay=0;this.voices=new Set();}
  unlock(){
    if(!this.enabled)return;
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
    try{if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.32;this.master.connect(this.context.destination);const n=this.context.sampleRate;this.noise=this.context.createBuffer(1,n,this.context.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}this.context.resume().catch(()=>{});}catch{this.context=null;}
  }
  setEnabled(enabled){this.enabled=enabled;if(this.master)this.master.gain.setTargetAtTime(enabled?.32:0,this.context.currentTime,.02);if(enabled)this.unlock();else this.stop();}
  noiseBurst(start,duration,frequency,volume,type='highpass',attack=.004){
    const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.65;
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+attack);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    source.connect(filter).connect(gain).connect(this.master);source.start(start,Math.random()*.4);source.stop(start+duration+.01);this.voices.add(source);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.voices.delete(source);};
  }
  crack(){if(!this.enabled||!this.context)return;const t=this.context.currentTime;// Two muted, low-pass snaps keep the brittle texture without piercing hiss.
    this.noiseBurst(t,.065,1500,.25,'lowpass',.009);
    this.noiseBurst(t+.032,.045,1100,.1,'lowpass',.007);}
  clay(intensity=.6){if(!this.enabled||!this.context)return;const c=this.context,t=c.currentTime;if(t-this.lastClay<.12)return;this.lastClay=t;this.noiseBurst(t,.18,280+intensity*230,.18+intensity*.12,'lowpass');
    const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(110+intensity*40,t);osc.frequency.exponentialRampToValueAtTime(52,t+.16);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+.19);osc.connect(gain).connect(this.master);osc.start();osc.stop(t+.2);this.voices.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();this.voices.delete(osc);};
  }
  stop(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();this.lastClay=0;}
}

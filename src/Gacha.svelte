<script>
  import { opportunities, challenges } from './database.js';

  let choice = "";
  let result = null;
  let showAnimation = false;
  let showResult = false;

  // Video path theo loại
  $: videoPath =
	choice === "opportunity"
	? "/gacha-opportunity.mp4"
	: choice === "number"
    ? "/gacha-number.mp4"
    : choice === "challenge"
    ? "/gacha-challenge.mp4"
    : "";

  function handleSelect(type) {
    choice = type;
    showResult = false;
    result = null;
  }
  function handleRoll() {
    if (!choice) return;
    showAnimation = true;
    showResult = false;
    result = null;
  }
  function handleAnimationEnd() {
  if(choice === "opportunity") {
    result = opportunities[Math.floor(Math.random() * opportunities.length)];
  } 
  else if(choice === "challenge") {
    result = challenges[Math.floor(Math.random() * challenges.length)];
  } 
  else if(choice === "number") {
    const num = Math.floor(Math.random() * (200 - (-50) + 1)) - 50;
    result = { name: "Thời khắc Aha đã giúp bạn nhận được số điểm BONUS là:", desc: num };
  }

  showAnimation = false;
  showResult = true;
}
</script>

<div class="gacha-app">
  <div class="header">
  <button class:active={choice === "opportunity"} on:click={() => handleSelect("opportunity")}>
    Gacha Cơ hội
  </button>

  <div class="divider"></div>

  <button class:active={choice === "challenge"} on:click={() => handleSelect("challenge")}>
    Gacha Thách thức
  </button>

  <div class="divider"></div>

  <button class:active={choice === "number"} on:click={() => handleSelect("number")}>
    Gacha Số
  </button>
</div>
  {#if choice}
    <div class="nav">
      <button class="roll-btn" on:click={handleRoll}>Quay</button>
    </div>
  {/if}
  {#if showAnimation}
    <div class="animation">
      <video src={videoPath} autoplay on:ended={handleAnimationEnd}></video>
    </div>
  {/if}
  {#if showResult}
  <div class="result-card star5">
    <div class="wrapper">
      <span class="caption">{result.name}</span>
    </div>
    <div class="content">
      {#if choice === "number"}
        <span class="big-number {result.desc < 0 ? 'bad' : 'good'}">
  {result.desc}
</span>
      {:else}
        {result.desc}
      {/if}
    </div>
  </div>
{/if}
</div>

<style src="./style.css"></style>
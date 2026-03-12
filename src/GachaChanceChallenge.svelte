<script>
  // List dữ liệu
  const opportunities = [
    "Sinh viên nghèo", 
    "Đồng điệu",
    "Trái Ngọt",
    "Bảo Hộ",
    "Cải tử hoàn sinh",
    "Mặt nạ thần bí"
  ];
  const challenges = [
    "Đường Cùng",
    "Cảm giác an toàn đã biến mất",
    "Sếp Yao Guang tới chơi",
    "Cuộc gặp gỡ của các thiên tài",
    "Hôm nay may mắn đấy",
    "Khỉ đuổi theo gió"
  ];

  // State
  let choice = ""; // "opportunity" hoặc "challenge"
  let result = "";
  let showAnimation = false;
  let showResult = false;

  function handleSelect(type) {
    choice = type;
    showResult = false;
  }
  function handleRoll() {
    showAnimation = true;
    showResult = false;
    result = "";
  }
  function handleAnimationEnd() {
    // Random kết quả dựa trên lựa chọn ban đầu
    if(choice === "opportunity") {
      result = opportunities[Math.floor(Math.random() * opportunities.length)];
    } else if(choice === "challenge") {
      result = challenges[Math.floor(Math.random() * challenges.length)];
    }
    showAnimation = false;
    showResult = true;
  }
</script>

<style>
  /* Style tùy chỉnh thêm nếu bạn muốn */
</style>

<!-- Giao diện chọn kiểu gacha -->
<div>
  <button on:click={() => handleSelect("opportunity")}>Gacha Cơ hội</button>
  <button on:click={() => handleSelect("challenge")}>Gacha Thách thức</button>
</div>

<!-- Nút Quay -->
{#if choice}
  <button on:click={handleRoll}>Quay</button>
{/if}

<!-- Hiện video hoạt ảnh khi quay -->
{#if showAnimation}
  <video src="gacha.mp4" autoplay on:ended={handleAnimationEnd} />
{/if}

<!-- Hiện kết quả sau khi video xong -->
{#if showResult}
  <div>Kết quả: <strong>{result}</strong></div>
{/if}
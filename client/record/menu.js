function openDropDown(element) {
  element.classList.toggle("show");
}
// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.inputSearch') && !event.target.matches('.dropButton')) {
    var dropdowns = document.getElementsByClassName("dropDownContent");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
function dropDownFilter(dropDown, search) {
  let input, filter, a, i;
  input = search;
  filter = input.value.toUpperCase();
  div = dropDown;
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}
let summerizeCheckbox = document.getElementById("summerizeCheckbox");
summerizeCheckbox.addEventListener("change",function(){
  let summaryDetails = document.getElementById('summaryDetails');
  if (summerizeCheckbox.checked) {
    summaryDetails.className = "visible";
  } else {
    summaryDetails.className = "hidden";
  }
})
document.getElementById("result").addEventListener('resize', () => {
    document.getElementById("result").scrollTop = document.getElementById("result").scrollHeight;  
});

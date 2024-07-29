M.AutoInit();
$(document).ready(function() {
  $('.dropdown-trigger').dropdown({hover: true, coverTrigger: false});
  $('.sidenav').sidenav();
});

$('#search').keydown(ev => {
  if (ev.key !== 'Enter' || ev.target.value === query) return;
  params.set('q', ev.target.value);
  location.href = `${location.origin}/search?${params}`;
});

// Currently unusued
function openCity(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the link that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}
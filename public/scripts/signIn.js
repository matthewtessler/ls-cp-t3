function onSignIn(googleUser) { 
  var profile = googleUser.getBasicProfile();
  document.cookie = "email="+profile.getEmail();
  document.getElementById('login').submit();
}
<template id="tpl-contact" data-title="contact.me" data-w="360" data-h="480" data-info="Mail|james@jamesbeckwith.com">
  <div class="doc contact-doc">
    <h2>contact.me</h2>
    <p class="sub">Send a message</p>
    <p class="contact-to"><a href="mailto:james@jamesbeckwith.com">james@jamesbeckwith.com</a></p>

    <div id="form-response" class="form-response" aria-live="polite"></div>

    <form id="ajax-contact" class="mac-form" novalidate>
      <label for="contact-name">Name</label>
      <input type="text" id="contact-name" name="name" required autocomplete="name">

      <label for="contact-email">Email</label>
      <input type="email" id="contact-email" name="email" required autocomplete="email">

      <label for="contact-message">Message</label>
      <textarea id="contact-message" name="message" rows="5" required></textarea>

      <div class="mac-form-actions">
        <button type="submit" class="mac-btn default">Send</button>
      </div>
    </form>
  </div>
</template>

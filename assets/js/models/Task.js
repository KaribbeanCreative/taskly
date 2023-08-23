'use strict';

class Task {
   // Create the object Task
   id;
   complete = false;
   title;
   isEditing = false;
   html = document.createElement('div');
   checkbox = document.createElement ('input');
   buttonModify = document.createElement('button');
   modifyTask = document.createElement('input');


   // Create and initialize an object instance of that class
   constructor (id, title) {
      this.id = id;
      this.title = title;

      // Label created task
      this.html.classList.add('task');

      this.checkbox.setAttribute('type', 'checkbox');
      this.checkbox.addEventListener('change', this.toggle);
      this.modifyTask.classList.add('readonly');
      this.modifyTask.setAttribute('readonly', true);
      this.modifyTask.addEventListener('keyup', (e) => e.key === 'Enter' ? this.modify() : null
      );
      this.modifyTask.value = this.title;

      // Button created task
      const button = document.createElement('button');
      button.classList.add('completeTask');
      button.textContent = '❌';
      button.addEventListener('click', this.delete);

      this.buttonModify.classList.add("EditTask");
      this.buttonModify.textContent = '✏️';
      this.buttonModify.addEventListener('click', this.modify);

      this.html.appendChild(this.checkbox);
      this.html.appendChild(this.modifyTask);
      this.html.appendChild(button);
      this.html.appendChild(this.buttonModify);
   };

   // Check a task
   toggle = () => {
      this.complete = this.checkbox.checked;
      this.notify();
   }

   // 
   notify = () => {
      const event = new Event('notify', {
         bubbles: true
      });
      this.html.dispatchEvent(event);
   }

   // Delete a task
   delete = () => {
      const event = new CustomEvent ('deleteTask', {
         bubbles: true,
         detail: this.id
      });
      this.html.dispatchEvent(event);
      this.html.remove();
   }

   // Modify a task
   modify = () => {
      this.isEditing = !this.isEditing;
      if (this.isEditing) {
         this.modifyTask.removeAttribute('readonly');
         this.modifyTask.classList.remove('readonly');
         this.modifyTask.select();
         this.buttonModify.textContent = '✅';
         onkeyup = keyCode == 13;
      } else {
         this.modifyTask.setAttribute('readonly', true);
         this.modifyTask.classList.add('readonly');
         this.buttonModify.textContent = "✏️";
         this.title = this.modifyTask.value;
      }
   }
}

// This extension was developed by :
// * Francisco Pina Martins https://github.com/StuntsPT
//
// Licence: GPLv3

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

// TasksManager function
function TasksManager(metadata)
{	
	//Stub file in use:
    //this.file = "/sys/class/drm/card0/device/power_profile";
    this.file = metadata.path + "/stubs/power_profile";

	this._init();
}

// Prototype
TasksManager.prototype =
{
	__proto__: PanelMenu.Button.prototype,
	
    	_init: function() 
    	{			
		PanelMenu.Button.prototype._init.call(this, St.Align.START);

		this.buttonText = new St.Label({text:_("(...)")});
		this.buttonText.set_style("text-align:center;");
		this.actor.add_actor(this.buttonText);
		this.buttonText.get_parent().add_style_class_name("panelButtonWidth");
			
		this._refresh();
	},
	
	_refresh: function()
	{    		
		let varFile = this.file;
		let tasksMenu = this.menu;
		let buttonText = this.buttonText;

    		// Clear
    		tasksMenu.removeAll();
		
    		// Sync
		if (GLib.file_test(this.file, GLib.FileTest.EXISTS))
		{
			let content = Shell.get_file_contents_utf8_sync(this.file);

            let message = "Current power profile: " + content;
			let item = new PopupMenu.PopupMenuItem(_(message));
			tasksMenu.addMenuItem(item);
					
                //TODO: Change text to icon.
			buttonText.set_text("(RPPM)");
		}
		else { global.logError("Radeon power profile manager : Error while reading file : " + varFile); }
		
		// Separator
		this.Separator = new PopupMenu.PopupSeparatorMenuItem();
		tasksMenu.addMenuItem(this.Separator);
		
		// Bottom section
		let bottomSection = new PopupMenu.PopupMenuSection();
		
        //savepoint
		this.newTask = new St.Entry(
		{
			name: "newTaskEntry",
			hint_text: _("New task..."),
			track_hover: true,
			can_focus: true
		});
		let entryNewTask = this.newTask.clutter_text;
		entryNewTask.connect('key-press-event', function(o,e)
		{
			let symbol = e.get_key_symbol();
		    	if (symbol == Clutter.Return)
		    	{
				tasksMenu.close();
				buttonText.set_text(_("(...)"));
				changeProfile(o.get_text(),varFile);
		    		entryNewTask.set_text('');
			}
		});
		
		bottomSection.actor.add_actor(this.newTask);
		bottomSection.actor.add_style_class_name("newTaskSection");
		tasksMenu.addMenuItem(bottomSection);
		/* tasksMenu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
			if (isOpen) {this.newTask.grab_key_focus();}
		}));*/ 
	},
	
	enable: function()
	{
		// Main.panel.addToStatusArea('tasks', this);  // how to destroy that correctly?
		Main.panel._rightBox.insert_child_at_index(this.actor, 0);
		Main.panel._menus.addMenu(this.menu);
		
		// Refresh menu
		let fileM = Gio.file_new_for_path(this.file);
		this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
		this.monitor.connect('changed', Lang.bind(this, this._refresh));
	},

	disable: function()
	{
		Main.panel._menus.removeMenu(this.menu);
		// Main.panel._statusArea['tasks'].destroy();
		Main.panel._rightBox.remove_actor(this.actor);
		this.monitor.cancel();
	}
}

// Remove task "text" from file "file"
function removeTask(text,file)
{
	if (GLib.file_test(file, GLib.FileTest.EXISTS))
	{
		let content = Shell.get_file_contents_utf8_sync(file);
		let tasks = content.toString().split('\n');
		let newText = "#tasks";
		
		for (let i=0; i<tasks.length; i++)
		{
			// if not corresponding
			if (tasks[i] != text)
			{
				if(tasks[i][0] != '#')
				{
					newText += "\n";
					newText += tasks[i];
				}
			}
		}
		let f = Gio.file_new_for_path(file);
		let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
		Shell.write_string_to_stream (out, newText);
	}
	else 
	{ global.logError("Todo list : Error while reading file : " + file); }
}

// Change power profile "text" in sysfs file "file"
function changeProfile(text,file)
{
	if (GLib.file_test(file, GLib.FileTest.EXISTS))
	{
		let content = Shell.get_file_contents_utf8_sync(file);
		//content = content + text + "\n";
        content = text
		
		let f = Gio.file_new_for_path(file);
		let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
		Shell.write_string_to_stream (out, content);
	}
	else 
	{ global.logError("Radeon power profile manager : Error while reading file : " + file); }
}

// Init function
function init(metadata) 
{		
	return new TasksManager(metadata);
}


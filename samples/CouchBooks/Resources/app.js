var NavigationController = require('lib/NavigationController').NavigationController,
    StateMachine = require('lib/state-machine').StateMachine,
    CouchClient = require('lib/couch_client').CouchClient,
    CouchServer = require('com.obscure.couchbase_ti'),
    books = require('ui/books');
    
var controller = new NavigationController();

var client;
var db;

/*
 * App startup logic implemented using a finite state machine:
 * 
 * Does 'books' database exist?
 *   yes: show the root window (in the future, maybe ensure that the views are loaded)
 *   no: create the 'books' database, then load the seed data
 * 
 * FSMs are a good fit for multi-step, asynchronous processes because they
 * allow you to control the order of remote operations.  Also, unlike a simple
 * queue, an FSM can be set up to handle branching and errors.
 * 
 * TODO: separate out the UI code from the FSM.  One way to do that would be
 * to provide the FSM with a function that gets called once the setup process
 * is complete, then open the RootWindow in that callback.
 */
var fsm = StateMachine.create({
  events: [
    { name: 'start',             from: 'none',              to: 'starting_server' },
    { name: 'server_started',    from: 'starting_server',   to: 'checking_for_db' },
    { name: 'db_exists',         from: 'checking_for_db',   to: 'done' },
    { name: 'db_does_not_exist', from: 'checking_for_db',   to: 'creating_db' },
    { name: 'created_db',        from: 'creating_db',       to: 'loading_seed_data' },
    { name: 'loaded_seed_data',  from: 'loading_seed_data', to: 'done' },
    { name: 'show_error',        from: ['creating_db', 'loading_seed_data', 'starting_server'], to: 'error' }
  ],
  callbacks: {
    onstarting_server: function(event, from, to) {
      var self = this;
      CouchServer.addEventListener('com.obscure.couchbase_ti.server_started', function(e) {
        client = new CouchClient(e.serverUrl);
        db = client.database('books');
        self.server_started();
      });
      CouchServer.startCouchbase();
    },
    onchecking_for_db: function(event, from, to) {
      var self = this;
      db.exists(function(resp) {
        resp ? self.db_exists() : self.db_does_not_exist();
      });
    },
    oncreating_db: function(event, from, to) {
      var self = this;
      db.create(function(resp, status) {
        if (status === 201) {
          self.created_db();
        }
        else {
          self.show_error('Error creating db: '+JSON.stringify(resp), status);
        }
      });
    },
    onloading_seed_data: function(event, from, to) {
      var self = this;
      var f = Ti.Filesystem.getFile('data/seed_data.json');
      var docs = JSON.parse(f.read());
      db.save(docs, function(data, status) {
        if (status === 201) {
          self.loaded_seed_data();
        }
        else {
          self.show_error('Error loading data: '+JSON.stringify(resp), status);
        }
      });
    },
    ondone: function(event, from, to) {
      controller.open(books.createRootWindow(controller, db));
    },
    onerror: function(event, from, to, msg, status) {
      alert(msg);
    }
  }
});
fsm.start();
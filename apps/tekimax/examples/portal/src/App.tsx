import { Route, Switch } from 'wouter';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateOrg from './pages/CreateOrg';
import OrgDetails from './pages/OrgDetails';
import TestLab from './pages/TestLab';

function App() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create-org" component={CreateOrg} />
      <Route path="/org/:id" component={OrgDetails} />
      <Route path="/test" component={TestLab} />
      <Route>
        <div className="flex h-screen items-center justify-center text-xl text-gray-400">
          404 - Page Not Found
        </div>
      </Route>
    </Switch>
  );
}

export default App;

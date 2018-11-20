# nodejs sample application for ICP

IBM Cloud Private sample application. 

This app uses the DevOps pipeline as described in [icp-cam-devops-demo](https://github.com/samisalkosuo/icp-cam-devops-demo), except that only ICP deployment is meant to be used.

## ICP monitoring

ICP includes monitoring service based on Prometheus and Grafana. Applications can use existing monitoring.

This app has /metrics endpoint to show custom metrics. 

See [app.js](app.js) for example of two metrics:

- total requests to / 
- total requests to /test

[ICP documentation](https://www.ibm.com/support/knowledgecenter/SSBS6K_3.1.0/featured_applications/deploy_monitoring.html) describes the monitoring service. In order to use application custom metrics, /metrics endpoint must be implemented and endpoint must return metrics data.

Metrics data must be formatted so that Prometheus understands:

- Metrics label naming: https://prometheus.io/docs/practices/naming/
- Metrics data format: https://prometheus.io/docs/instrumenting/exposition_formats/
- See [app.js](app.js) /metrics endpoint is an example of custom metrics.
- Metrics service must be added. See metrics-service of the application, [service.yaml](jenkins/helm/nodejs-sample/templates/service.yaml)

### Using custom metrics

After application is deployed and if it has metrics service, ICP includes application metrics endpoint to Prometheus as a target. 

All Prometheus targets are shown in the Prometheus UI: https://<ICP_MASTER_IP>:8443/prometheus/targets.

Grafana is used as monitoring UI: https://<ICP_MASTER_IP>:8443/grafana/.

Steps to create custom dashboard to show application custom metrics:

- Create new dashboard and add Graph-panel.
  <img src="images/icp_grafana_1.png" alt="grafana_1" width="800"/>
- New dashboard is created. Use drop down next to "Panel title" and select "Edit".
  <img src="images/icp_grafana_2.png" alt="edit panel" width="800"/>
- Select data source "Prometheus".
- Enter "nodejs" to text field and you see the two custom metrics.
  <img src="images/icp_grafana_3.png" alt="edit panel" width="800"/>
- Select "nodejs_sample_root_requests_total"
- Select "General" tab and change panel name to: "HTTP requests: /".
  <img src="images/icp_grafana_4.png" alt="edit panel" width="800"/>
- In the dashboard settings, change the dashboard name to: "Node.js Sample App Custom Metrics".
  <img src="images/icp_grafana_5.png" alt="edit panel" width="800"/>
- Click time selector (for example: "Last 6 hours") and change range and add refresh interval:
  <img src="images/icp_grafana_6.png" alt="edit panel" width="800"/>
- Add another panel for "HTTP requests: /test".
- Save dashboard.
- Open sample application many times using URLs: / and /test.
- You see custom metrics in Grafana dashboard:
  <img src="images/icp_grafana_7.png" alt="edit panel" width="800"/>

import BaseService from "../base.service";

class DashboardService extends BaseService {
  constructor() {
    super("/admin");
  }

  async getDashboardData() {
    return await this.get("/dashboard");
  }
}

export default DashboardService;

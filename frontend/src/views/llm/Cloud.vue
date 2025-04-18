<script setup lang="ts">
import {ref, onMounted, reactive, computed} from 'vue';
import {
  GetCloudLLMModels,
  CreateCloudLLMModel,
  UpdateCloudLLMModel,
  DeleteCloudLLMModel,
  ToggleCloudLLMModelEnabled
} from '../../../wailsjs/go/main/App';
import {models as modelTypes} from '../../../wailsjs/go/models';
import {LLM_PROVIDERS, getProviderById, getProviderIcon, getProviderModels} from '../../constants/LLMProviders';
import {useToast} from "../../utils/toast";
import ConfirmDialog from '../../components/ConfirmDialog.vue';

interface FormData {
  name: string;
  apiKey: string;
  provider: string;
}

const toast = useToast();

// 分页数据
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
  loading: false
});

// 状态管理
const showForm = ref(false);
const showConfirmDialog = ref(false);
const confirmDialogData = reactive({
  modelId: 0,
  message: ''
});
const showPassword = ref(false);
const selectedProvider = ref<string>('');
const currentModel = ref<modelTypes.CloudLLMModel | null>(null);
const editingId = ref<number | null>(null);
const modelList = ref<modelTypes.CloudLLMModel[]>([]);

// 表单数据
const formData = ref<FormData>({
  name: '',
  apiKey: '',
  provider: ''
});

// 根据选择的提供商获取可用模型
const availableModels = computed(() => {
  if (!selectedProvider.value) {
    return [];
  }
  return getProviderModels(selectedProvider.value);
});

// 显示添加表单
function showAddApiForm(): void {
  showForm.value = true;
  resetForm();
}

// 隐藏添加表单
function hideAddApiForm(): void {
  showForm.value = false;
  resetForm();
}

// 重置表单
function resetForm(): void {
  formData.value = {
    name: '',
    apiKey: '',
    provider: ''
  };
  selectedProvider.value = '';
  editingId.value = null;
}

// 切换密码可见性
function togglePasswordVisibility(): void {
  showPassword.value = !showPassword.value;
}

// 选择提供商
function selectProvider(providerId: string): void {
  selectedProvider.value = providerId;
  formData.value.provider = providerId;
}

// 加载云端模型列表
const loadModels = () => {
  pagination.loading = true;
  GetCloudLLMModels(pagination.page, pagination.size).then((result) => {
    modelList.value = result.items;
    pagination.total = result.total;
    pagination.loading = false;
  })
}

// 处理表单提交
const handleFormSubmit = () => {
  if (!selectedProvider.value) {
    toast.warning("请选择供应商")
    return;
  }

  // 创建新的模型对象，使用Wails生成的模型类
  const modelData = new modelTypes.CloudLLMModel();
  modelData.id = editingId.value || 0;
  modelData.name = formData.value.name;
  modelData.provider = selectedProvider.value;
  modelData.api_key = formData.value.apiKey;

  // 从常量设置endpoint
  const provider = getProviderById(selectedProvider.value);
  modelData.endpoint = provider ? provider.endpoint : '';
  modelData.enabled = true;

  if (editingId.value) {
    // 更新现有API
    UpdateCloudLLMModel(modelData).then(() => {
      toast.success("已更新")
    });
  } else {
    // 添加新API
    CreateCloudLLMModel(modelData).then(() => {
      toast.success("已添加")
    });
  }

  // 关闭表单并刷新列表
  hideAddApiForm();
  loadModels();
}

// 删除API
const deleteModel = (id: number) => {
  confirmDialogData.modelId = id;
  confirmDialogData.message = '确定要删除这个模型吗？';
  showConfirmDialog.value = true;
}

const handleConfirmDelete = () => {
  DeleteCloudLLMModel(confirmDialogData.modelId).then(() => {
    toast.success("已删除")
    loadModels()
  })
  showConfirmDialog.value = false;
}

const handleCancelDelete = () => {
  showConfirmDialog.value = false;
}

// 编辑API
function editModel(model: modelTypes.CloudLLMModel): void {
  editingId.value = model.id;
  selectedProvider.value = model.provider;
  formData.value = {
    name: model.name,
    apiKey: model.api_key,
    provider: model.provider
  };

  showForm.value = true;
}

// 切换模型启用状态
const toggleModelEnabled = (id: number, enabled: boolean) => {
  ToggleCloudLLMModelEnabled(id, !enabled).then(() => {
    toast.success(`API模型已${!enabled ? '启用' : '禁用'}`)
    loadModels();
  })
}

// 分页控制
function changePage(newPage: number): void {
  pagination.page = newPage;
  loadModels();
}


// 测试模型
function testModel(model: modelTypes.CloudLLMModel): void {
  console.log('测试模型:', model);
}

// 组件挂载时加载数据
onMounted(() => {
  loadModels();
});
</script>

<template>
  <div class="container mx-auto px-5 max-w-6xl">
    <div class="bg-primary/10 dark:bg-primary/5 rounded-lg p-4 mb-6 flex gap-4">
      <div class="text-2xl">💡</div>
      <div class="flex flex-col gap-2">
        <p><span class="font-semibold dark:text-base-content">云端模型</span>允许您使用第三方云服务。请前往服务商官网获取API密钥，并在此页面进行设置。</p>
        <p class="dark:text-base-content/70">所有API密钥均存储在您的本地设备，不会上传至 Grove 服务器，确保您的账户安全。</p>
      </div>
    </div>

    <div class="bg-warning/10 dark:bg-warning/5 rounded-lg p-4 mb-6 flex gap-4">
      <span class="text-2xl">🔒</span>
      <div class="text-sm leading-relaxed dark:text-base-content/70">
        <strong class="dark:text-base-content">隐私提示：</strong>云端模型可能会收集和存储您的数据。对于敏感数据，我们强烈推荐使用本地私有化模型，确保您的数据始终在本地处理，不经过任何外部服务器。
      </div>
    </div>

    <main>
      <!-- API列表和添加按钮容器 -->
      <div class="flex flex-col gap-5 mb-6">
        <!-- 添加API按钮 - 移到顶部 -->
        <button class="btn btn-primary self-start flex items-center gap-2" @click="showAddApiForm">
          <span class="text-base font-bold">+</span>
          <span>添加模型</span>
        </button>

        <!-- API列表区域 -->
        <div class="flex flex-col gap-3">
          <!-- 加载状态显示 -->
          <div v-if="pagination.loading" class="flex justify-center py-10">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>

          <!-- 空状态显示 -->
          <div class="flex flex-col items-center justify-center py-10 px-5 bg-base-200/30 dark:bg-base-100/5 rounded-lg text-center"
               v-else-if="modelList.length === 0">
            <div class="text-3xl opacity-70 dark:opacity-60 mb-4">🔑</div>
            <p class="text-base-content/70 dark:text-base-content/50 mb-5">您还没有添加任何API密钥</p>
          </div>

          <!-- API模型列表 -->
          <template v-else>
            <div v-for="model in modelList" :key="model.id"
                 class="flex items-center justify-between p-4 bg-gradient-to-r from-base-200/20 to-base-200/5 dark:from-gray-800/40 dark:to-gray-800/30 rounded-lg border border-base-300/20 dark:border-gray-700/30 transition-all hover:bg-base-200/30 dark:hover:bg-gray-800/50">
              <div class="flex items-center gap-4">
                <div class="min-w-10 h-10 rounded-md bg-white/90 dark:bg-gray-700 flex items-center justify-center p-1.5 border border-base-300/10 dark:border-gray-600">
                  <img :src="getProviderIcon(model.provider)" class="w-7 h-7 object-contain" :alt="model.provider">
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-base text-base-content dark:text-gray-200">{{ model.name }}</span>
                  <span class="text-sm text-base-content/70 dark:text-gray-400">{{ model.provider }}</span>
                </div>
              </div>
              <div class="flex gap-3 items-center">
                <input type="checkbox" class="toggle toggle-success toggle-sm"
                       :checked="model.enabled"
                       @change="toggleModelEnabled(model.id, model.enabled)" />
                <button class="px-3 py-1 text-sm text-base-content/80 dark:text-gray-300 hover:text-primary dark:hover:text-primary-300"
                        @click="testModel(model)">
                  <span>测试</span>
                </button>
                <button class="px-3 py-1 text-sm text-base-content/80 dark:text-gray-300 hover:text-base-content dark:hover:text-gray-100"
                        @click="editModel(model)">
                  <span>编辑</span>
                </button>
                <button class="px-3 py-1 text-sm text-base-content/80 dark:text-gray-300 hover:text-error dark:hover:text-error-300"
                        @click="deleteModel(model.id)">
                  <span>删除</span>
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- 分页组件 -->
        <div v-if="!pagination.loading && pagination.total > pagination.size"
             class="flex items-center justify-between mt-4">
          <div class="text-sm text-base-content/70">
            共 {{ pagination.total }} 条记录
          </div>
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :class="pagination.page <= 1 ? 'btn-disabled' : ''"
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
            >
              «
            </button>
            <button class="join-item btn btn-sm">
              {{ pagination.page }}
            </button>
            <button
              class="join-item btn btn-sm"
              :class="pagination.page * pagination.size >= pagination.total ? 'btn-disabled' : ''"
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page * pagination.size >= pagination.total"
            >
              »
            </button>
          </div>
        </div>

      </div>

      <!-- 添加/编辑API表单 弹窗 -->
      <Teleport to="body">
        <div class="fixed inset-0 bg-black/50 z-50" v-if="showForm" @click.self="hideAddApiForm"></div>
        <div
          class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto z-50"
          v-if="showForm">
          <form @submit.prevent="handleFormSubmit">
            <div class="mb-5">
              <!-- API提供商选项 -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div
                  v-for="provider in LLM_PROVIDERS"
                  :key="provider.id"
                  class="flex flex-col items-center gap-2 p-4 border border-base-300 rounded-lg cursor-pointer transition-all hover:bg-base-200/20"
                  :class="{ 'border-primary bg-primary/5': selectedProvider === provider.id }"
                  :data-provider="provider.id"
                  @click="selectProvider(provider.id)"
                >
                  <img :src="provider.icon" class="w-8 h-8 object-contain" :alt="provider.name">
                  <span class="text-sm">{{ provider.name }}</span>
                </div>
              </div>
            </div>

            <div class="mb-5">
              <label for="apiName" class="block mb-2 font-medium text-base-content">名称</label>
              <input type="text" id="apiName" v-model="formData.name" required placeholder="为这个API起个名字"
                     class="input input-bordered w-full">
            </div>

            <div class="mb-5">
              <label for="apiKey" class="block mb-2 font-medium text-base-content">API密钥</label>
              <div class="relative flex">
                <input :type="showPassword ? 'text' : 'password'" id="apiKey" v-model="formData.apiKey" required
                       class="input input-bordered w-full pr-10">
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                        @click="togglePasswordVisibility">
                  <span class="text-base"
                        :class="{ 'opacity-100': showPassword, 'opacity-50': !showPassword }">👁️</span>
                </button>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6 md:flex-row sm:flex-col">
              <button type="button" class="btn btn-outline" @click="hideAddApiForm">取消</button>
              <button type="submit" class="btn btn-primary">保存</button>
            </div>
          </form>
        </div>
      </Teleport>

      <!-- 确认对话框 -->
      <ConfirmDialog
        :show="showConfirmDialog"
        :message="confirmDialogData.message"
        @confirm="handleConfirmDelete"
        @cancel="handleCancelDelete"
      />
    </main>
  </div>
</template>

<style scoped>
</style>


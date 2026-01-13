import triton_python_backend_utils as pb_utils
import json
import numpy as np

class TritonPythonModel:
    def initialize(self, args):
        self.model_config = json.loads(args['model_config'])

    def execute(self, requests):
        responses = []
        for request in requests:
            # 1. Decode Input (Intent)
            in_0 = pb_utils.get_input_tensor_by_name(request, "intent")
            intent_bytes = in_0.as_numpy().flatten()[0] # Handle any shape [1], [1,1] etc.
            intent = intent_bytes.decode('utf-8')
            
            # 2. Fast Classification Logic ( < 1ms )
            # In Phase 6, this can be swapped for a BERT/ONNX model
            tool = "default_llm"
            confidence = 0.5
            reasoning = "Default routing"

            intent_lower = intent.lower()

            if "research" in intent_lower or "search" in intent_lower:
                tool = "deep_research"
                confidence = 0.95
                reasoning = "Keyword 'research' detected."
            elif "quantum" in intent_lower or "optimize" in intent_lower:
                tool = "quantum_optimize" 
                confidence = 0.98
                reasoning = "Keywords for quantum optimization detected."
            elif "sign" in intent_lower or "encrypt" in intent_lower:
                 tool = "crypto_service"
                 confidence = 0.90
                 reasoning = "Cryptographic intent detected."
            
            # 3. Enhance Confidence (Simulate Neural Network)
            if len(intent) > 20: 
                confidence += 0.01

            # 4. Encode Outputs
            out_tool = pb_utils.Tensor("tool", np.array([tool.encode('utf-8')], dtype=object))
            out_conf = pb_utils.Tensor("confidence", np.array([confidence], dtype=np.float32))
            out_reason = pb_utils.Tensor("reasoning", np.array([reasoning.encode('utf-8')], dtype=object))

            responses.append(pb_utils.InferenceResponse(output_tensors=[out_tool, out_conf, out_reason]))

        return responses

    def finalize(self):
        pass
